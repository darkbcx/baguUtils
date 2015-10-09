xxx
angular.module('baguUtils', ['auth0', 'angular-storage', 'angular-jwt'])
    .service('baguAuth0Service', ['$q', '$http', '$rootScope', 'auth', 'store', baguAuth0Service])
    .service('baguCommonService', ['$mdDialog', '$mdToast', baguCommonService])

    .directive("baguTollbar", ['baguAuth0Service', 'store', '$mdSidenav', '$location', baguTollbar])

    .config(['authProvider', '$httpProvider', 'jwtInterceptorProvider', authInit])

    .run(['auth', authHookEvents])
    .run(['$rootScope', 'auth', 'store', 'jwtHelper', '$location', authOnRefresh])
;

//diubah sesuai kebutuhan
var currentScriptPath = "../../vendor/baguUtils/";

function baguAuth0Service($q, $http, $rootScope, auth, store) {
    var self = this;

    this.signin = function (param) {
        auth.signin(
            param,
            function (profile, token) {
                if(profile && token) {
                    console.log(profile);
                    console.log(token);
                    store.set('profile', profile);
                    store.set('token', token);
                    $rootScope.$broadcast("onBaguLoggedIn")
                } else {
                    $rootScope.$broadcast("onBaguLoggedInError")
                }
            },
            function (error) {
                console.log(error);
                $rootScope.$broadcast("onBaguLoggedInError")
            }
        );
    };

    this.logout = function () {
        auth.signout();
        store.remove('profile');
        store.remove('token');
        $rootScope.$broadcast("onBaguLoggedOut")
    };

    this.getUser = function (field, value) {
        return $q(function (resolve, reject) {
            var myUrl = "https://wanda.auth0.com/api/v2/users?q=" + field + "%3A%22" + value + "%22&search_engine=v2";
            $http({
                method: "GET",
                url: myUrl,
                headers: {
                    "Content-Type": "application/json",
                    "Authorization": "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJhdWQiOiJDRTZ6WTlNRGJPblA2MFpPUm1vMEVEaUFjZWhubEZOdCIsInNjb3BlcyI6eyJ1c2VycyI6eyJhY3Rpb25zIjpbInJlYWQiXX19LCJpYXQiOjE0NDE3OTgwNDEsImp0aSI6ImI1NWMxOWYwZmQ4ZDUzZTZlNDMwZjE1NGRlZmZmZjllIn0.VCwEF-aEsU8uigxnkKsgvvkCZGYNCJzE-urxpccQTvs"
                }
            }).then(function (result) {
                if (result.data) {
                    resolve(result.data);
                } else {
                    resolve({})
                }
            }).catch(function (err) {
                reject(err);
            })
        })
    };

    this.getUserCustomQuery = function (query) {
        var strTmp = encodeURI(query);
        strTmp = strTmp.replace(':','%3A');

        return $q(function (resolve, reject) {
            var myUrl = "https://wanda.auth0.com/api/v2/users?q=" + strTmp + "&search_engine=v2";
            $http({
                method: "GET",
                url: myUrl,
                headers: {
                    "Content-Type": "application/json",
                    "Authorization": "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJhdWQiOiJDRTZ6WTlNRGJPblA2MFpPUm1vMEVEaUFjZWhubEZOdCIsInNjb3BlcyI6eyJ1c2VycyI6eyJhY3Rpb25zIjpbInJlYWQiXX19LCJpYXQiOjE0NDE3OTgwNDEsImp0aSI6ImI1NWMxOWYwZmQ4ZDUzZTZlNDMwZjE1NGRlZmZmZjllIn0.VCwEF-aEsU8uigxnkKsgvvkCZGYNCJzE-urxpccQTvs"
                }
            }).then(function (result) {
                if (result.data) {
                    resolve(result.data);
                } else {
                    resolve({})
                }
            }).catch(function (err) {
                reject(err);
            })
        })
    };

    this.getAllUser = function (fields, sort) {
        fields = typeof fields !== 'undefined' ? fields : "";
        sort = typeof sort !== 'undefined' ? sort : "";
        return $q(function (resolve, reject) {
            $http({
                method: "GET",
                url: "https://wanda.auth0.com/api/v2/users?include_totals=true&fields=user_id&include_fields=true",
                headers: {
                    "Authorization": "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJhdWQiOiJDRTZ6WTlNRGJPblA2MFpPUm1vMEVEaUFjZWhubEZOdCIsInNjb3BlcyI6eyJ1c2VycyI6eyJhY3Rpb25zIjpbInJlYWQiXX19LCJpYXQiOjE0NDE1OTM5ODAsImp0aSI6ImU0ODQ0ZjliNjk0MjAxNmVlNmRmZjMxNzExOTI3OWYzIn0.ZHVRk5KwfXDcKr50zhW5UQwkSnoDghrNUe-uukGYaCM"
                }
            }).then(function (result) {
                var loop = Math.ceil(result.data.total / result.data.length);
                var promises = [];
                for (var a = 0; a < loop; a++) {
                    promises.push(self.getUserPartial(a, fields));
                }
                return $q.all(promises);
            }).then(function (result) {
                var tmp = [];
                for (var a = 0; a < result.length; a++) {
                    tmp = tmp.concat(result[a].data);
                }
                if (sort) {
                    console.log(sort);
                    tmp.sort(function (a, b) {
                        if (a[sort] > b[sort]) {
                            return 1;
                        } else if (a[sort] < b[sort]) {
                            return -1;
                        } else if(!a[sort] || !b[sort]) {
                        } else {
                            return 0;
                        }
                    });
                }
                resolve(tmp);
            }).catch(function (err) {
                reject(err);
            })
        })
    };

    this.getUserPartial = function (page, fields) {
        return $q(function (resolve, reject) {
            var myUrl = "https://wanda.auth0.com/api/v2/users?page=" + page.toString();
            if (fields) {
                //myUrl += "&fields=" + fields.replace(",","%2C") + "&include_fields=true";
                myUrl += "&fields=" + fields + "&include_fields=true";
            }
            console.log(myUrl);
            $http({
                method: "GET",
                url: myUrl,
                headers: {
                    "Authorization": "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJhdWQiOiJDRTZ6WTlNRGJPblA2MFpPUm1vMEVEaUFjZWhubEZOdCIsInNjb3BlcyI6eyJ1c2VycyI6eyJhY3Rpb25zIjpbInJlYWQiXX19LCJpYXQiOjE0NDE1OTM5ODAsImp0aSI6ImU0ODQ0ZjliNjk0MjAxNmVlNmRmZjMxNzExOTI3OWYzIn0.ZHVRk5KwfXDcKr50zhW5UQwkSnoDghrNUe-uukGYaCM"
                }
            }).then(function (result) {
                resolve(result);
            }).catch(function (err) {
                console.log(err);
                reject(err);
            })
        });
    };

    this.addUser = function (param) {
        param.connection = "Username-Password-Authentication";
        return $q(function (resolve, reject) {
            var myUrl = "https://wanda.auth0.com/api/v2/users";
            $http({
                method: "POST",
                url: myUrl,
                headers: {
                    "Content-Type": "application/json",
                    "Authorization": "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJhdWQiOiJDRTZ6WTlNRGJPblA2MFpPUm1vMEVEaUFjZWhubEZOdCIsInNjb3BlcyI6eyJ1c2VycyI6eyJhY3Rpb25zIjpbInJlYWQiLCJjcmVhdGUiXX19LCJpYXQiOjE0NDA0OTAwNTgsImp0aSI6Ijk3MTFmOTM5YzE1NzJiZTE4NzYzNzk0YzgxYzBmNDU0In0.XtBQoxQzqNXyoG1xHANJJTtE-D73yoR7tCBTH5mmtSk"
                },
                json: param
            }).then(function (result) {
                resolve(result.data);
            }).catch(function (err) {
                reject(err);
            });
        });
    };

    this.editUser = function (record) {
        var myUserID = record.user_id;
        var myRecord = {};

        if(record.blocked) { myRecord.blocked = record.blocked }
        if(record.email_verified) { myRecord.email_verified = record.email_verified }
        if(record.verify_email) { myRecord.verify_email = record.verify_email }
        if(record.password) { myRecord.password = record.password }
        if(record.verify_password) { myRecord.verify_password = record.verify_password }
        if(record.user_metadata) { myRecord.user_metadata = record.user_metadata }
        if(record.app_metadata) { myRecord.app_metadata = record.app_metadata }

        var myURL = "https://wanda.auth0.com/api/v2/users/" + encodeURI(myUserID);

        return $q(function (resolve, reject) {
            if (myUserID) {
                $http({
                    method: "PATCH",
                    url: myURL,
                    headers: {
                        "Authorization": "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJhdWQiOiJDRTZ6WTlNRGJPblA2MFpPUm1vMEVEaUFjZWhubEZOdCIsInNjb3BlcyI6eyJ1c2VycyI6eyJhY3Rpb25zIjpbInVwZGF0ZSJdfX0sImlhdCI6MTQzOTM4NjYzMSwianRpIjoiODkwOGFiNTc5YjdkN2JmNDk0MDFlOGUxOWZmYjc3M2UifQ.7snMOfHFWmVQpIO7Yo8gPsZhtVGMbBqtD_OwHD60bZ0"
                    },
                    data: myRecord
                }).then(function (result) {
                    resolve(result.data);
                }).catch(function (err) {
                    reject(err);
                })
            } else {
                reject({
                    "statusCode": 400,
                    "error": "Bad Request",
                    "message": "Parameter required : 'user_id",
                    "errorCode": "invalid_parameter"
                })
            }
        });
    };

    this.sendVerificationEmail = function(userID) {
        return $q(function (resolve, reject) {
            if (userID) {
                $http({
                    method: "POST",
                    url: "https://wanda.auth0.com/api/v2/jobs/verification-email",
                    headers: {
                        "Authorization": "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJhdWQiOiJDRTZ6WTlNRGJPblA2MFpPUm1vMEVEaUFjZWhubEZOdCIsInNjb3BlcyI6eyJ1c2VycyI6eyJhY3Rpb25zIjpbInJlYWQiLCJ1cGRhdGUiXX19LCJpYXQiOjE0NDM0NDI5MzUsImp0aSI6IjBhZGI4MzMwYTgwYWE0ZGQ3NTA0YWVhODFlYjIxOTFlIn0.TlMbNlrWKpjhhxgLBtDHbxacFc1ODg-TIvVutPMp7LE"
                    },
                    data: {"user_id": userID}
                }).then(function (result) {
                    resolve(result.data);
                }).catch(function (err) {
                    reject(err);
                })
            } else {
                reject({
                    "statusCode": 400,
                    "error": "Bad Request",
                    "message": "Parameter required : 'user_id",
                    "errorCode": "invalid_parameter"
                })
            }
        });
    }

}

function baguCommonService($mdDialog,$mdToast) {
    var self = this;

    this.showAlert = function (message, title) {
        title = typeof title !== 'undefined' ? title : "Info";
        var saveAlert = $mdDialog.alert().title(title).content(message).ok("Close");
        $mdDialog.show(saveAlert);
    };

    this.showToast = function (message) {
        $mdToast.show(
            $mdToast.simple().content(message).position("bottom left").hideDelay(3000)
        );
    };

    this.stripSpecialChars = function(value) {
        return value.toString().replace(/[^a-z0-9]+/gi, "");
    };
}

function baguTollbar(baguAuth0Service, store, $mdSidenav, $location) {
    console.log("XXX");
    return {
        restrict: 'E',
        scope: {
            title: '@',
            sideMenuName: '@',
            logoutPath: '@'
        },
        templateUrl: currentScriptPath + "toolbar.html",
        link: function (scope) {
            scope.myPath = currentScriptPath;
            scope.loggedInUser = store.get("profile");

            scope.logout = function () {
                console.log(scope.logoutPath);
                baguAuth0Service.logout();
                if(scope.logoutPath) {
                    $location.path(scope.logoutPath);
                }
            };

            scope.toggleMenu = function () {
                console.log("scope.sideMenuName : ", scope.sideMenuName);
                $mdSidenav(scope.sideMenuName).toggle();
            };

        }
    }
}

//====================================================================================================

function authInit(authProvider, $httpProvider, jwtInterceptorProvider) {
    authProvider.init({
        domain: 'wanda.auth0.com',
        clientID: 'Y1Cf6eriFyrwOfoYHIHPfNrhIKBjkVPC'
    });
    jwtInterceptorProvider.tokenGetter = ['store', function(store) {
        // Return the saved token
        return store.get('token');
    }];

    $httpProvider.interceptors.push('jwtInterceptor');
}

function authHookEvents(auth) {
    auth.hookEvents();
}

function authOnRefresh($rootScope, auth, store, jwtHelper) {
    $rootScope.$on('$locationChangeStart', function () {
        var token = store.get('token');
        if (token) {
            if (!jwtHelper.isTokenExpired(token)) {
                if (!auth.isAuthenticated) {
                    auth.authenticate(store.get('profile'), token);
                }
            } else {
                $rootScope.$broadcast("onBaguTokenExpired")
            }
        } else {
            $rootScope.$broadcast("onBaguTokenExpired")
        }
    })
}