import { ng } from '../ng-start';
import { appPrefix } from '../globals';
import { ImageEditor } from '../image-editor/ImageEditor';
import { template } from '../template';

export const imageEditor = ng.directive('imageEditor', () => {
    return {
        restrict: 'E',
        scope: {
            document: '@'
        },
        templateUrl: '/' + appPrefix + '/public/template/entcore/image-editor/main.html',
        link: (scope, element, attributes) => {
            scope.template = template;

            const imageEditor = new ImageEditor();

            const start = async () => {
                await ImageEditor.init();
                imageEditor.draw(element);
                await imageEditor.drawImage(attributes.document);
                scope.openTool('Rotate');
                scope.$apply();
            };

            scope.openTool = (name: string) => {
                imageEditor.useTool(name);
                template.open('entcore/image-editor/tool', 'entcore/image-editor/' + name.toLowerCase());
            };

            scope.apply = () => imageEditor.applyChanges();
            scope.restoreOriginal = () => imageEditor.restoreOriginal();
            scope.hasHistory = () => imageEditor.hasHistory;
            scope.undo = () => imageEditor.imageView.undo();

            attributes.$observe('document', () => start());
        }
    }
})