import { Eventer } from 'entcore-toolkit';
import { $ } from "../index";

const eventer = new Eventer();

export class ImageView{
    sprite: PIXI.Sprite;
    stage: PIXI.Container;
    renderer: PIXI.CanvasRenderer | PIXI.WebGLRenderer;
    history: Blob[] = [];
    editingElement: any;
    historyIndex: number;

    private paint(image: string): Promise<any>{
        return new Promise((resolve, reject) => {
            this.stage = new PIXI.Container();
            this.sprite = new PIXI.Sprite(
                PIXI.loader.resources[image].texture
            );
            this.stage.addChild(this.sprite);
            this.renderer.render(this.stage);
            setTimeout(() => {
                this.sprite.pivot.set(this.sprite.width / 2, this.sprite.height / 2);
                this.renderer.resize(this.sprite.width, this.sprite.height);
                this.sprite.position = {
                    x: this.sprite.width / 2,
                    y: this.sprite.height / 2
                } as PIXI.Point;
                
                this.render();
                this.backup();
                resolve();
            }, 100);
        });
    }

    render(){
        this.renderer.render(this.stage);
        requestAnimationFrame(() => 
            this.editingElement.find('.tools-background').height(this.editingElement.find('.output').height())
        );
    }

    resetHistory(){
        this.historyIndex = 0;
        this.history.splice(1, this.history.length - 1);
    }

    get hasHistory(): boolean{
        return this.historyIndex > 0;
    }

    loadImage(image: HTMLImageElement): Promise<any>{
        return new Promise((resolve, reject) => {
            this.stage.removeChildren();
            this.sprite = new PIXI.Sprite(PIXI.Texture.from(image));
            this.stage.addChild(this.sprite);
            this.renderer.render(this.stage);
            setTimeout(() => {
                this.sprite.pivot.set(this.sprite.width / 2, this.sprite.height / 2);
                this.renderer.resize(this.sprite.width, this.sprite.height);
                this.sprite.position = {
                    x: this.sprite.width / 2,
                    y: this.sprite.height / 2
                } as PIXI.Point;
                
                this.render();
                resolve();
            }, 100);
        });
    }

    setOverlay(){
        this.editingElement.find('.overlay').width($(this.editingElement.find('.output')).width());
        this.editingElement.find('.overlay').height($(this.editingElement.find('.output')).height());
    }

    load(image: string, renderer: PIXI.CanvasRenderer | PIXI.WebGLRenderer, editingElement: any): Promise<any>{
        return new Promise((resolve, reject) => {
            this.renderer = renderer;
            this.editingElement = editingElement;
            const onload = () => {
                this.paint(image)
                    .then(() => resolve());
                eventer.trigger('loaded-' + image);
            };
    
            if(PIXI.loader.resources[image]){
                if(PIXI.loader.resources[image].isLoading){
                    eventer.once('loaded-' + image, onload);
                    return;
                }
                onload();
            }
            const loaderOptions = {
                loadType: PIXI.loaders.Resource.LOAD_TYPE.IMAGE,
                xhrType: PIXI.loaders.Resource.XHR_RESPONSE_TYPE.BLOB
            };
            PIXI.loader
                .add(image, image, loaderOptions)
                .load(onload);
        });
    }

    loadBlob(blob: Blob){
        const imageUrl = URL.createObjectURL(blob);
        const image = new Image();
        image.src = imageUrl;
        image.onload = () => {
            this.loadImage(image);
        };
    }

    undo(){
        this.historyIndex --;
        this.loadBlob(this.history[this.history.length - 2]);
    }

    backup(){
        this.renderer.view.toBlob((blob) => {
            this.historyIndex ++;
            this.history.splice(this.historyIndex);
            this.history.push(blob);
            this.loadBlob(blob);
        }, 'image/jpeg', 1);
    }
}