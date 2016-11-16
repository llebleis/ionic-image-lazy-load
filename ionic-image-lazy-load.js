/**
 * Created by PAVEI on 30/09/2014.
 * Updated by Ross Martin on 12/05/2014
 * Updated by Davide Pastore on 04/14/2015
 * Updated by Michel Vidailhet on 05/12/2015
 * Updated by Rene Korss on 11/25/2015
 */

angular.module('ionicLazyLoad', []);

angular.module('ionicLazyLoad')

  .directive('lazyScroll', ['$rootScope',
    function($rootScope) {
      return {
        restrict: 'A',
        link: function ($scope, $element) {
          var origEvent = $scope.$onScroll;
          $scope.$onScroll = function () {
            $rootScope.$broadcast('lazyScrollEvent');

            if(typeof origEvent === 'function'){
              origEvent();
            }
          };
        }
      };
    }])

  .directive('imageLazySrc', ['$document', '$timeout', '$ionicScrollDelegate', '$compile', '$cordovaFile',
    '$cordovaFileTransfer',
    function ($document, $timeout, $ionicScrollDelegate, $compile, $cordovaFile, $cordovaFileTransfer) {
      return {
        restrict: 'A',
        scope: {
          lazyScrollResize: "@lazyScrollResize",
          imageLazyBackgroundImage: "@imageLazyBackgroundImage",
          imageLazySrc: "@"
        },
        link: function ($scope, $element, $attributes) {
          if (!$attributes.imageLazyDistanceFromBottomToLoad) {
            $attributes.imageLazyDistanceFromBottomToLoad = 0;
          }
          if (!$attributes.imageLazyDistanceFromRightToLoad) {
            $attributes.imageLazyDistanceFromRightToLoad = 0;
          }

          var loader;
          if ($attributes.imageLazyLoader) {
            loader = $compile('<div class="image-loader-container"><ion-spinner class="image-loader" icon="' + $attributes.imageLazyLoader + '"></ion-spinner></div>')($scope);
            $element.after(loader);
          }

          $scope.$watch('imageLazySrc', function (oldV, newV) {
            if(loader)
              loader.remove();
            if ($attributes.imageLazyLoader) {
              loader = $compile('<div class="image-loader-container"><ion-spinner class="image-loader" icon="' + $attributes.imageLazyLoader + '"></ion-spinner></div>')($scope);
              $element.after(loader);
            }
            var deregistration = $scope.$on('lazyScrollEvent', function () {
                //    console.log('scroll');
                if (isInView()) {
                  loadImage();
                  deregistration();
                }
              }
            );
            $timeout(function () {
              if (isInView()) {
                loadImage();
                deregistration();
              }
            }, 500);
          });
          var deregistration = $scope.$on('lazyScrollEvent', function () {
              // console.log('scroll');
              if (isInView()) {
                loadImage();
                deregistration();
              }
            }
          );

          function cacheFile(imageName, imageURL, img_tag) {
            $cordovaFileTransfer.download(imageURL, cordova.file.cacheDirectory + imageName, {}, true).then(
              function (fileEntry) {
                img_tag.src = cordova.file.cacheDirectory + imageName;
              },
              function (error) {
                console.log("error can't copy " + imageURL + " to local cache");
                img_tag.src = imageURL;
              }
            );
          };

          function loadImage() {
            //Bind "load" event
            $element.bind("load", function (e) {
              if ($attributes.imageLazyLoader) {
                loader.remove();
              }
              if ($scope.lazyScrollResize == "true") {
                //Call the resize to recalculate the size of the screen
                $ionicScrollDelegate.resize();
              }
              $element.unbind("load");
            });

            if ($scope.imageLazyBackgroundImage == "true") {
              var bgImg = new Image();
              bgImg.onload = function () {
                if ($attributes.imageLazyLoader) {
                  loader.remove();
                }
                $element[0].style.backgroundImage = 'url(' + $attributes.imageLazySrc + ')'; // set style attribute on element (it will load image)
                if ($scope.lazyScrollResize == "true") {
                  //Call the resize to recalculate the size of the screen
                  $ionicScrollDelegate.resize();
                }
              };
              bgImg.src = $attributes.imageLazySrc;
            } else {
              if($element[0].src == '') {
                //Check if image is in localStorage
                var imageName = $attributes.imageLazySrc.substring($attributes.imageLazySrc.lastIndexOf('/')+1);
                console.log("imageName : " + imageName);
                if(typeof cordova !== "undefined") {
                  window.resolveLocalFileSystemURL(cordova.file.cacheDirectory+imageName,
                    function (fileEntry) {
                      fileEntry.file(function(file){
                        var exp = (file.lastModified/1000)+(60*5); //5 minutes local cache
                        var now = Date.now()/1000;
                        if(exp < now) {
                          $element[0].src = cordova.file.cacheDirectory + imageName;
                        } else {
                          cacheFile(imageName, $attributes.imageLazySrc, $element[0]);
                        }
                      });
                    },
                    function (error) { //not in cache already
                      //Get file content and copy it to cache Directory
                      cacheFile(imageName, $attributes.imageLazySrc, $element[0]);
                    }
                  );
                } else {
                  $element[0].src = $attributes.imageLazySrc;
                }

                //$element[0].src = $attributes.imageLazySrc; // set src attribute on element (it will load image)
              }
            }
          }

          function isInView() {
            var clientHeight = $document[0].documentElement.clientHeight;
            var clientWidth = $document[0].documentElement.clientWidth;
            var imageRect = $element[0].getBoundingClientRect();
            return (imageRect.top >= 0 && imageRect.top <= clientHeight + parseInt($attributes.imageLazyDistanceFromBottomToLoad))
              && (imageRect.left >= 0 && imageRect.left <= clientWidth + parseInt($attributes.imageLazyDistanceFromRightToLoad));
          }

          // bind listener
          // listenerRemover = scrollAndResizeListener.bindListener(isInView);

          // unbind event listeners if element was destroyed
          // it happens when you change view, etc
          $element.on('$destroy', function () {
            deregistration();
          });

          // explicitly call scroll listener (because, some images are in viewport already and we haven't scrolled yet)
          $timeout(function () {
            if (isInView()) {
              loadImage();
              deregistration();
            }
          }, 500);
        }
      };
    }]);

