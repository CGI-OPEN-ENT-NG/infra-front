import http from 'axios';
import { Eventer } from 'entcore-toolkit';
import { ImageView } from './ImageView';
import * as imageTools from './image-tools';
import { Tool } from './Tool';
import { Document } from '../workspace';

const eventer = new Eventer();
const editorWidth = 680;
const editorHeight = 400;

export class ImageEditor{
    static loaded: boolean;
    static loading: boolean;
    imageView: ImageView = new ImageView();
    renderer: PIXI.CanvasRenderer | PIXI.WebGLRenderer;
    editingElement: any;
    tool: Tool;
    document: Document;

    constructor(){

    }

    useTool(name: string, options?){
        const tool = new imageTools[name]();
        tool.start(this.imageView, this.editingElement);
        this.tool = tool;
        this.imageView.resetHistory();
    }

    applyChanges(options?){
        this.tool.apply(options);
    }

    async saveChanges(){
        await this.imageView.backup();
        await this.document.update(this.imageView.history[this.imageView.history.length - 1]);
    }

    get hasHistory(){
        return this.imageView.hasHistory;
    }

    static async init(){
        return new Promise((resolve, reject) => {
            if(ImageEditor.loaded){
                resolve();
                return;
            }
            if(ImageEditor.loading){
                eventer.on('loaded', () => resolve());
                return;
            }
            ImageEditor.loading = true;
            http.get('/infra/public/js/pixi.min.js').then((response) => {
                eval(response.data);
                ImageEditor.loaded = true;
                ImageEditor.loading = false;
                resolve();
                eventer.trigger('loaded');
            });
        })
    }

    async draw(el: any){
        this.editingElement = el;
        this.renderer = PIXI.autoDetectRenderer(editorWidth, editorHeight, { 
            preserveDrawingBuffer: true,
            transparent: true 
        });
        await ImageEditor.init();
        el.find('.output').append(this.renderer.view);
    }

    async drawDocument(document: Document){
        await this.imageView.load('/workspace/document/' + document._id, this.renderer, this.editingElement);
        this.document = document;
    }

    async restoreOriginal(){
        await this.imageView.loadBlob(this.imageView.history[0]);
        this.tool.start(this.imageView, this.editingElement);
    }
}