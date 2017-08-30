import { ImageView } from '../ImageView';
import { Tool } from '../Tool';
import { $ } from "../../index";

export class Resize implements Tool{
    imageView: ImageView;
    editingElement: any;
    handle: any;
    isResizing: boolean;

    get scale(): number{
        if(this.imageView.sprite.width > this.imageView.sprite.height){
            let scale = this.outputWidth / this.imageView.sprite.width;
            if(scale > 1){
                return 1;
            }
            return scale;
        }
        let scale = this.outputHeight / this.imageView.sprite.height;
        if(scale > 1){
            return 1;
        }
        return scale;
    }

    get outputWidth(): number{
        return this.editingElement.find('.output').width();
    }

    get outputHeight(): number{
        return this.editingElement.find('.output').height();
    }

    apply(options?: any){
        this.imageView.sprite.scale = new PIXI.Point(1, 1);
        this.imageView.render();
        requestAnimationFrame(() => {
            this.imageView.renderer.resize(
                this.handle.width() * (this.imageView.sprite.width / this.outputWidth), 
                this.handle.height() * (this.imageView.sprite.height / this.outputHeight)
            );
            requestAnimationFrame(() => {
                this.imageView.sprite.width = this.handle.width() * (this.imageView.sprite.width / this.outputWidth);
                this.imageView.sprite.height = this.handle.height() * (this.imageView.sprite.height / this.outputHeight);

                this.imageView.sprite.position = {
                    x: this.imageView.sprite.width / 2,
                    y: this.imageView.sprite.height / 2
                } as PIXI.Point;
        
                this.imageView.render();

                requestAnimationFrame(async () => {
                    await this.imageView.backup(false);
                    this.setup();
                });
            });
        });
    }

    resize(){
        this.imageView.sprite.width = this.handle.width();
        this.imageView.sprite.height = this.handle.height();
        this.imageView.sprite.position.x = (this.handle.position().left + 2) + this.imageView.sprite.width / 2;
        this.imageView.sprite.position.y = (this.handle.position().top + 2) + this.imageView.sprite.height / 2;
        this.imageView.render();
    }

    setHandle(){
        this.handle = this.editingElement.find('.handle');
        this.handle.width(this.imageView.sprite.width - 4);
        this.handle.height(this.imageView.sprite.height - 4);
        this.handle.css({ 
            top: (this.imageView.sprite.position.y - this.imageView.sprite.height / 2) + 'px', 
            left: (this.imageView.sprite.position.x - this.imageView.sprite.width / 2) + 'px'
        });
    }

    lockOutput(){
        this.editingElement.find('.output').height(this.editingElement.find('.output').height());
    }

    setup(){
        requestAnimationFrame(() => {
            this.imageView.setOverlay();
            this.imageView.renderer.resize(this.outputWidth, this.outputHeight);
            this.imageView.sprite.pivot.set(this.imageView.sprite.width / 2, this.imageView.sprite.height / 2);
            requestAnimationFrame(() => {
                this.imageView.sprite.scale = new PIXI.Point(this.scale, this.scale);
                this.imageView.sprite.position = {
                    x: this.imageView.renderer.width / 2,
                    y: this.imageView.renderer.height / 2
                } as PIXI.Point;
                
                this.imageView.render();
            });
            
            this.imageView.render();
            
            requestAnimationFrame(() => {
                this.lockOutput();
                this.setHandle();
            });
        });
    }

    stop(){
        this.imageView.sprite.pivot.set(this.imageView.sprite.width / 2, this.imageView.sprite.height / 2);
        this.imageView.renderer.resize(this.imageView.sprite.width, this.imageView.sprite.height);
        this.imageView.sprite.position = {
            x: this.imageView.sprite.width / 2,
            y: this.imageView.sprite.height / 2
        } as PIXI.Point;
    }

    start(imageView: ImageView, editingElement: any){
        this.imageView = imageView;
        this.editingElement = editingElement;
        let token;
        const animate = () => {
            if(!this.isResizing){
                return;
            }
            this.resize();
            token = requestAnimationFrame(animate);
        }
        editingElement.on('startResize', '.handle', () => {
            this.isResizing = true;
            animate();
        });
        editingElement.on('stopResize', '.handle', () => {
            this.isResizing = false;
            cancelAnimationFrame(token);
        });
        setTimeout(() => this.setup(), 60);
    }
}