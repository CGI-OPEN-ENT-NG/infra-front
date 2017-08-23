import { ng } from '../ng-start';

export const progressBar = ng.directive('progressBar', function(){
	return {
		restrict: 'E',
		scope: {
			max: '=',
			filled: '=',
			unit: '@'
		},
		template: '<div class="progress-bar">' +
			'<div class="filled">[[filled]] <span translate content="[[unit]]"></span></div>[[max]] <span translate content="[[unit]]"></span>' +
			'</div>',
		link: function(scope, element, attributes){
			function updateBar(){
				var filledPercent = scope.filled * 100 / scope.max;
				element.find('.filled').width(filledPercent + '%');
				if(filledPercent < 10){
					element.find('.filled').addClass('small');
				}
				else{
					element.find('.filled').removeClass('small');
				}
			}

			scope.$watch('filled', function(newVal){
				updateBar();
			});

			scope.$watch('max', function(newVal){
				updateBar();
			});
		}
	}
});