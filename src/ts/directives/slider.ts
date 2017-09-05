import { ng } from '../ng-start';
import { idiom } from '../idiom';
import { $ } from '../libs/jquery/jquery';
import { ui } from '../ui';

export let slider = ng.directive('slider', ['$compile', '$parse', function ($compile, $parse) {
    return {
        restrict: 'E',
        scope: {
            min: '@',
            max: '@',
            ngModel: '=',
            label: '@'
        },
        template: `
            <div class="bar"></div>
            <div class="filled"></div>
            <div class="cursor"></div>
            <div class="label">[[label]]</div>
            <legend class="min"></legend>
            <legend class="max"></legend>`,
        link: function (scope, element, attributes) {
            element.addClass('drawing-zone');
            const cursor = element.children('.cursor');
            const label = element.children('.label');
            const max = parseFloat(attributes.max);
            const min = parseFloat(attributes.min);

            const applyValue = function (newVal) {
                var pos = parseInt((newVal - min) * element.children('.bar').width() / (max - min));
                cursor.css({
                    left: pos + 'px',
                    position: 'absolute'
                });
                label.css({
                    left: pos + 'px',
                    position: 'absolute'
                });
                element.children('.filled').width(cursor.position().left);
            };

            $(window).on('resize', function () {
                applyValue(scope.ngModel);
            });

            scope.$watch('ngModel', applyValue);

            if (typeof scope.ngModel !== 'number') {
                scope.ngModel = attributes.default;
                applyValue(scope.ngModel);
            }

            element.children('legend.min').html(idiom.translate(attributes.minLegend));
            element.children('legend.max').html(idiom.translate(attributes.maxLegend));

            element.children('.bar, .filled').on('click', function (e) {
                var newPos = e.clientX - element.children('.bar').offset().left;
                var newVal = (newPos * (max - min) / element.children('.bar').width()) + min;
                if(newVal < min){
                    newVal = min;
                }
                scope.ngModel = newVal;
                scope.$apply();
            });

            ui.extendElement.draggable(cursor, {
                lock: {
                    vertical: true
                },
                mouseUp: function () {
                    var cursorPosition = cursor.position().left;
                    var newVal = (cursorPosition * (max - min) / element.children('.bar').width()) + min;
                    if(newVal < min){
                        newVal = min;
                    }
                    scope.ngModel = newVal;
                    scope.$apply();
                },
                tick: function () {
                    var cursorPosition = cursor.position().left;
                    element.children('.filled').width(cursorPosition);
                    label.css({ left: cursor.position().left + 'px' })
                }
            });
        }
    }
}]);
