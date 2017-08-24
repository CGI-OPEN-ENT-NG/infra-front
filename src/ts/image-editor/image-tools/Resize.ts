import { ImageView } from '../ImageView';
import { Tool } from '../Tool';
import { $ } from "../../index";

export class Resize implements Tool{
    imageView: ImageView;
    editingElement: any;
    handle: any;
    widthRatio: number;
    heightRatio: number;

    get canvasLeft(): number{
        return this.editingElement.find('canvas').position().left;
    }

    get canvasTop(): number{
        return this.editingElement.find('canvas').position().top;
    }

    get outputWidth(): number{
        return this.editingElement.find('.output').width();
    }

    get outputHeight(): number{
        return this.editingElement.find('.output').height();
    }

    apply(options?: any){
        this.imageView.renderer.resize(this.imageView.sprite.width, this.imageView.sprite.height);
        this.imageView.sprite.width = this.imageView.renderer.width;
        this.imageView.sprite.height = this.imageView.renderer.height;
        this.imageView.sprite.position = {
            x: this.imageView.sprite.width / 2,
            y: this.imageView.sprite.height / 2
        } as PIXI.Point;

        this.imageView.render();
        setTimeout(async () => {
            await this.imageView.backup();
            setTimeout(() => {
                this.start(this.imageView, this.editingElement);
            }, 30)
        }, 30);
    }

    resize(){
        this.imageView.sprite.width = this.handle.width() * this.widthRatio;
        this.imageView.sprite.height = this.handle.height() * this.heightRatio;
        this.imageView.sprite.position.x = ((this.handle.position().left + 2 - this.canvasLeft)  * this.widthRatio) + this.imageView.sprite.width / 2;
        this.imageView.sprite.position.y = ((this.handle.position().top + 2 - this.canvasTop)  * this.heightRatio) + this.imageView.sprite.height / 2;
        this.imageView.render();
    }

    setHandle(){
        this.handle = this.editingElement.find('.handle');
        this.handle.width(this.imageView.sprite.width / this.widthRatio);
        this.handle.height(this.imageView.sprite.height / this.heightRatio);
        this.handle.css({ 
            top: ((this.imageView.sprite.position.y - this.imageView.sprite.height / 2) / this.heightRatio) + 'px', 
            left: ((this.imageView.sprite.position.x - this.imageView.sprite.width / 2) / this.widthRatio) + 'px'
        });
    }

    lockOutput(){
        this.editingElement.find('.output').height(this.editingElement.find('.output').height());

        this.widthRatio =  this.imageView.renderer.width / this.editingElement.find('canvas').width();
        this.heightRatio = this.imageView.renderer.height / this.editingElement.find('canvas').height();
    }

    start(imageView: ImageView, editingElement: any){
        this.imageView = imageView;
        this.editingElement = editingElement;
        let token;
        const animate = () => {
            this.resize();
            token = requestAnimationFrame(animate);
        }
        editingElement.on('startResize', '.handle', () => {
            animate();
        });
        editingElement.on('stopResize', '.handle', () => cancelAnimationFrame(token));

        setTimeout(() => {
            this.imageView.setOverlay();
            
            if(this.imageView.renderer.width < this.outputWidth || this.imageView.renderer.height < this.outputHeight){
                this.imageView.renderer.resize(this.outputWidth, this.outputHeight);
                this.imageView.sprite.position = {
                    x: this.imageView.renderer.width / 2 - this.imageView.sprite.width / 2,
                    y: this.imageView.renderer.height / 2 - this.imageView.sprite.height / 2
                } as PIXI.Point;
                this.imageView.render();
            }
            
            setTimeout(() => {
                this.lockOutput();
                this.setHandle();
            }, 30);
        }, 70);
    }
}