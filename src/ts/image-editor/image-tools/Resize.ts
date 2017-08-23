import { ImageView } from '../ImageView';
import { Tool } from '../Tool';
import { $ } from "../../index";

export class Resize implements Tool{
    imageView: ImageView;
    handle: any;

    apply(options?: any){

    }

    resize(){
        $(this.imageView.renderer.view).css({ left: this.handle.position().left + 'px', top: this.handle.position().top + 'px' });
        this.imageView.renderer.resize(this.handle.width(), this.handle.height());
        this.imageView.render();
    }

    start(imageView: ImageView, editingElement: any){
        this.imageView = imageView;
        let token;
        const animate = () => {
            
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
            this.resize();
        }, 70);
    }
}