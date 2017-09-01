import { appPrefix } from '../globals';
import { ng } from '../ng-start';
import { $ } from "../libs/jquery/jquery";
import { MediaLibrary, Document } from '../workspace';
import { template } from '../template';
import { model } from '../modelDefinitions';
import { idiom } from '../idiom';

export const mediaLibrary = ng.directive('mediaLibrary', function(){
	return {
		restrict: 'E',
		scope: {
			ngModel: '=',
			ngChange: '&',
			multiple: '=',
			fileFormat: '='
		},
		templateUrl: '/' + appPrefix + '/public/template/entcore/media-library/main.html',
		link: function(scope, element, attributes){
			scope.template = template;

			scope.$watch(function(){
				return scope.$parent.$eval(attributes.visibility);
			}, function(newVal){
				scope.visibility = newVal;
				if(!scope.visibility){
					scope.visibility = 'protected';
				}
				scope.visibility = scope.visibility.toLowerCase();
			});

			scope.openCompression = (doc: Document) => {
				if(doc.role() !== 'img'){
					return;
				}
				scope.display.editedDocument = doc;
			};

			scope.upload = {
				documents: []
			};

			element.on('dragenter', '.drop-zone', (e) => {
				e.preventDefault();
			});

			element.on('dragover', '.drop-zone', (e) => {
				element.find('.drop-zone').addClass('dragover');
				e.preventDefault();
			});

			element.on('dragleave', '.drop-zone', () => {
				element.find('.drop-zone').removeClass('dragover');
			});

			element.on('drop', '.drop-zone', async (e) => {
				element.find('.drop-zone').removeClass('dragover');
				element.find('.drop-zone').addClass('loading-panel');
				e.preventDefault();
				const files = e.originalEvent.dataTransfer.files;
				scope.importFiles(e.originalEvent.dataTransfer.files);
				scope.$apply();
			});

			scope.$watch('ngModel', function(newVal){
				if((newVal && newVal._id) || (newVal && scope.multiple && newVal.length)){
					scope.ngChange();
				}
				scope.upload.documents = [];
			});

			$('body').on('click', '.lightbox-backdrop', function(){
				scope.upload.documents = [];
			});

			template.open('entcore/media-library/main', 'entcore/media-library/browse');
			
			scope.myDocuments = MediaLibrary.myDocuments;

			scope.display = {
				search: '',
				limit: 12
			};

			scope.show = function(tab){
				template.open('entcore/media-library/main', 'entcore/media-library/' + tab);
				scope.upload.loading = [];
			};

			scope.listFrom = function(listName){
				scope.display.listFrom = listName;
				MediaLibrary[scope.display.listFrom].sync();
			};

			scope.openFolder = function(folder){
				if(scope.openedFolder.closeFolder && folder.folder.indexOf(scope.openedFolder.folder + '_') === -1){
					scope.openedFolder.closeFolder();
				}

				scope.openedFolder = folder;
				folder.sync();
				folder.on('sync', function(){
					scope.documents = filteredDocuments(folder);
					scope.folders = folder.folders.all;
					scope.$apply();
				});
			};

			scope.$watch('visibility', function(newVal){
				if(model.me && model.me.workflow.workspace.create){
					if(scope.visibility === 'public'){
						scope.display.listFrom = 'publicDocuments';
					}
					else{
						scope.display.listFrom = 'appDocuments';
					}
				}
				else if(model.me && model.me.workflow.workspace.list){
					scope.display.listFrom = 'sharedDocuments';
				}

				MediaLibrary.eventer.on('sync', function(){
					scope.documents = filteredDocuments(MediaLibrary[scope.display.listFrom]);
					if(MediaLibrary[scope.display.listFrom].folders){
						scope.folders = MediaLibrary[scope.display.listFrom].folders.filter(function(folder){
							return idiom.removeAccents(folder.name.toLowerCase()).indexOf(idiom.removeAccents(scope.display.search.toLowerCase())) !== -1;
						});
						scope.$apply('folders');
					} else {
						delete(scope.folders);
					}

					scope.folder = MediaLibrary[scope.display.listFrom];
					scope.openedFolder = scope.folder;
					scope.$apply('documents');
				});

				scope.$watch('fileFormat', function(newVal){
					if(!newVal){
						return;
					}

					if(newVal === 'audio'){
						template.open('entcore/media-library/main', 'entcore/media-library/record');
					}
					else{
						template.open('entcore/media-library/main', 'entcore/media-library/browse');
					}

					if (MediaLibrary[scope.display.listFrom].documents.length === 0) {
						MediaLibrary[scope.display.listFrom].sync();
					}
					else {
						MediaLibrary[scope.display.listFrom].trigger('sync');
					}
				});
			});

			function filteredDocuments(source){
				return source.documents.filter(function(doc){
					return (doc.role() === scope.fileFormat || scope.fileFormat === 'any') &&
						idiom.removeAccents(doc.metadata.filename.toLowerCase()).indexOf(idiom.removeAccents(scope.display.search.toLowerCase())) !== -1;
				});
			}

			scope.insertRecord = async () => {
				await MediaLibrary.appDocuments.sync();
				template.open('entcore/media-library/main', 'entcore/media-library/browse');
				scope.listFrom('appDocuments');
			};

			scope.selectDocument = function(document){
				if((scope.folder === MediaLibrary.appDocuments && scope.visibility === 'protected') ||
					(scope.folder === MediaLibrary.publicDocuments && scope.visibility === 'public')){
					if(scope.multiple){
						scope.ngModel = [document];
					}
					else{
						scope.ngModel = document;
					}
				}
				else{
					var copyFn = document.protectedDuplicate;
					if(scope.visibility === 'public'){
						copyFn = document.publicDuplicate;
					}
					scope.display.loading = [document];
						copyFn.call(document, function(newFile){
						scope.display.loading = [];
						if(scope.multiple){
							scope.ngModel = [newFile];
							scope.$apply();
						}
						else{
							scope.ngModel = newFile;
							scope.$apply();
						}
					});
				}
			};

			scope.selectDocuments = function(){
				var selectedDocuments = scope.documents.filter(d => d.selected);
				if((scope.folder === MediaLibrary.appDocuments && scope.visibility === 'protected') ||
					(scope.folder === MediaLibrary.publicDocuments && scope.visibility === 'public')){
					scope.ngModel = selectedDocuments;
				}
				else{
					var duplicateDocuments = [];
					var documentsCount = 0;
					scope.display.loading = selectedDocuments;
					selectedDocuments.forEach(function(doc){
						var copyFn = doc.protectedDuplicate.bind(doc);
						if(scope.visibility === 'public'){
							copyFn = doc.publicDuplicate.bind(doc);
						}

						copyFn(function(newFile){
							scope.display.loading = [];
							duplicateDocuments.push(newFile);
							documentsCount++;
							if(documentsCount === selectedDocuments.length){
								scope.ngModel = duplicateDocuments;
								scope.$apply();
							}
						});
					})
				}
			};

			scope.importFiles = function(files){
				if(!files){
					files = scope.upload.files;
				}
				for(var i = 0; i < files.length; i++){
					let doc = new Document();
					scope.upload.documents.push(doc);
					doc.upload(files[i], scope.visibility);
				}
				scope.upload.files = undefined;
				template.open('entcore/media-library/main', 'entcore/media-library/loading');
			};

			scope.updateSearch = function(){
				scope.documents = filteredDocuments(scope.openedFolder);
			};

			scope.editImage = () => {
				scope.display.editDocument = true;
			};
		}
	}
});