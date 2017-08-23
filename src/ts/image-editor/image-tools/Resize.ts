import { ImageView } from '../ImageView';
import { Tool } from '../Tool';
import { $ } from "../../index";

export class Resize implements Tool{
    imageView: ImageView;
    handle: any;
    widthRatio: number;
    heightRatio: number;

    apply(options?: any){
        this.imageView.renderer.resize(this.imageView.sprite.width, this.imageView.sprite.height);
        this.imageView.sprite.width = this.imageView.renderer.width;
        this.imageView.sprite.height = this.imageView.renderer.height;
        this.imageView.render();
    }

    resize(){
        this.imageView.sprite.width = this.handle.width() * this.widthRatio;
        this.imageView.sprite.height = this.handle.height() * this.heightRatio;
        this.imageView.sprite.position.x = (this.handle.position().left  * this.widthRatio) + this.imageView.sprite.width / 2 + 2;
        this.imageView.sprite.position.y = (this.handle.position().top  * this.heightRatio) + this.imageView.sprite.height / 2 + 2;
        this.imageView.render();
    }

    start(imageView: ImageView, editingElement: any){
        this.imageView = imageView;
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
            this.handle = editingElement.find('.handle');
            this.imageView.setOverlay();
            editingElement.find('.output').height(editingElement.find('.output').height());
            editingElement.find('canvas').css({ position: 'absolute' });
            this.widthRatio =  this.imageView.renderer.width / editingElement.find('.output').width();
            this.heightRatio = this.imageView.renderer.height / editingElement.find('.output').height();
            this.handle.width(editingElement.find('.output').width() - 4);
            this.handle.height(editingElement.find('.output').height() - 4);
            this.handle.css({ top: '0px', left: '0px' });
        }, 100);
    }
}