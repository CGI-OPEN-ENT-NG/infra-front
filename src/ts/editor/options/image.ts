import { ui } from '../../ui';
import { $ } from '../../libs/jquery/jquery';


const showImageContextualMenu = (refElement) => {
    const imageMenu = $(`
        <div class="image-contextual-menu" style="z-index: 15">
            <button>Retoucher</button>

            <i class="resize-image small"></i>
            <i class="resize-image medium"></i>
            <i class="resize-image large selected"></i>
        </div>
    `)
    .appendTo('body');

    const image = refElement.find('img');

    if(image.attr('src').indexOf('thumbnail') !== -1){
        const width = parseInt(image.attr('src').split('thumbnail=')[1].split('x')[0]);
        if(width === 150){
            imageMenu.find('.selected').removeClass('selected');
            imageMenu.find('.small').addClass('selected');
        }
        if(width === 290){
            imageMenu.find('.selected').removeClass('selected');
            imageMenu.find('.medium').addClass('selected');
        }
    }
    
    const refreshPositon = (size: string) => {
        imageMenu.find('.selected').removeClass('selected');
        imageMenu.find('.' + size).addClass('selected');
        image.on('load', () => {
            imageMenu.offset({
                top: refElement.offset().top + refElement.height() + 10,
                left: refElement.offset().left + 5
            });
        });
    };

    imageMenu.offset({
        top: refElement.offset().top + refElement.height() + 10,
        left: refElement.offset().left + 5
    })
    .on('click', 'button', () => {
        
    })
    .on('click', 'i.small', () => {
        image.attr('src', image.attr('src').split('?')[0] + '?thumbnail=150x150');
        refreshPositon('small');
    })
    .on('click', 'i.medium', () => {
        refElement.find('img').attr('src', refElement.find('img').attr('src').split('?')[0] + '?thumbnail=290x290');
        refreshPositon('medium');
    })
    .on('click', 'i.large', () => {
        refElement.find('img').attr('src', refElement.find('img').attr('src').split('?')[0] + '?thumbnail=2600x0');
        refreshPositon('large');
    });
    
    setTimeout(() => {
        $(document).one('selectionchange', (e) => {
            if(imageMenu.find(e.target).length === 0){
                imageMenu.remove();
            }
        })
    }, 0);
}

export const image = {
    name: 'image', 
    run: function(instance){
        return {
            template: '<i ng-click="imageOption.display.pickFile = true" tooltip="editor.option.image"></i>' +
            '<div ng-if="imageOption.display.pickFile">' +
            '<lightbox show="imageOption.display.pickFile" on-close="imageOption.display.pickFile = false;">' +
            '<media-library ng-change="updateContent()" multiple="true" ng-model="imageOption.display.files" file-format="\'img\'" visibility="imageOption.visibility"></media-library>' +
            '</lightbox>' +
            '</div>',
            link: function (scope, element, attributes) {
                instance.editZone.on('click', 'img', (e) => {
                    if(!$(e.target).attr('src').startsWith('/workspace') && !$(e.target).attr('src').startsWith('/assets')){
                        return;
                    }
                    let parentSpan = $('<span contenteditable="false" class="image-container">&#8203;</span>');
                    if($(e.target).parent().hasClass('image-container')){
                        parentSpan = $(e.target.parentNode);
                    }
                    else{
                        e.target.parentNode.insertBefore(parentSpan[0], e.target);
                        parentSpan.append(e.target);
                    }
                    
                    const sel = window.getSelection();
                    sel.removeAllRanges();
                    const newRange = new Range();
                    newRange.selectNode(parentSpan[0]);
                    sel.addRange(newRange);
                    showImageContextualMenu(parentSpan);
                });

                ui.extendSelector.touchEvents('[contenteditable] img');

                scope.imageOption = {
                    display: { pickFile: false },
                    visibility: 'protected'
                }

                if(instance.visibility === 'public'){
                    scope.imageOption.visibility = 'public'
                }

                instance.editZone.addClass('drawing-zone');
                scope.display = {};
                scope.updateContent = function () {
                    var path = '/workspace/document/';
                    if (scope.imageOption.visibility === 'public') {
                        path = '/workspace/pub/document/';
                    }
                    var html = '<span contenteditable="false" class="image-container">&#8203;';
                    scope.imageOption.display.files.forEach(function (file) {
                        html += '<img src="' + path + file._id + '?thumbnail=290x290" class="latest-image" /></span>';
                    });
                    instance.selection.replaceHTMLInline(html);
                    let image = instance.editZone
                        .find('.latest-image')
                        .removeClass('latest-image');
                    image.on('load', () => image.trigger('click'));
                    instance.addState(instance.editZone.html());
                    scope.imageOption.display.pickFile = false;
                    scope.imageOption.display.files = [];
                    instance.focus();
                };

                instance.element.on('drop', function (e) {
                    var image;
                    if (e.originalEvent.dataTransfer.mozSourceNode) {
                        image = e.originalEvent.dataTransfer.mozSourceNode;
                    }

                    //delay to account for image destruction and recreation
                    setTimeout(function(){
                        if(image && image.tagName && image.tagName === 'IMG'){
                            image.remove();
                        }
                        instance.addState(instance.editZone.html());
                        ui.extendElement.resizable(instance.editZone.find('img'), {
                            moveWithResize: false,
                            mouseUp: function() {
                                instance.trigger('contentupdated');
                                instance.addState(instance.editZone.html());
                            }
                        });
                    }, 20)
                });
            }
        }
    }
};