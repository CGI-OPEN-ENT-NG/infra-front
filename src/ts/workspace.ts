import { Behaviours } from './behaviours';
import { moment } from './libs/moment/moment';
import { _ } from './libs/underscore/underscore';
import { notify } from './notify';
import { idiom as lang } from './idiom';
import http from 'axios';
import { Eventer, Mix, Selection, Selectable } from 'entcore-toolkit';
import { model } from './modelDefinitions';

class Quota {
    max: number;
    used: number;
    unit: string;

    constructor() {
        this.max = 1;
        this.used = 0;
        this.unit = 'Mo'
    }

    appropriateDataUnit(bytes: number) {
        var order = 0
        var orders = {
            0: lang.translate("byte"),
            1: "Ko",
            2: "Mo",
            3: "Go",
            4: "To"
        }
        var finalNb = bytes
        while (finalNb >= 1024 && order < 4) {
            finalNb = finalNb / 1024
            order++
        }
        return {
            nb: finalNb,
            order: orders[order]
        }
    }

    async refresh (): Promise<void> {
        const response = await http.get('/workspace/quota/user/' + model.me.userId);
        const data = response.data;
        //to mo
        data.quota = data.quota / (1024 * 1024);
        data.storage = data.storage / (1024 * 1024);

        if (data.quota > 2000) {
            data.quota = Math.round((data.quota / 1024) * 10) / 10;
            data.storage = Math.round((data.storage / 1024) * 10) / 10;
            this.unit = 'Go';
        }
        else {
            data.quota = Math.round(data.quota);
            data.storage = Math.round(data.storage);
        }

        this.max = data.quota;
        this.used = data.storage;
    }
};

export let quota = new Quota();

export class Revision{
}

enum DocumentStatus{
    initial = 'initial', loaded = 'loaded', failed = 'failed', loading = 'loading'
}

export class Document implements Selectable {
    title: string;
    _id: string;
    created: any;
    metadata: {
        'content-type': string,
		role: string,
		extension: string
    };
	version: number;
	link: string;
	icon: string;
	owner: {
		userId: string
    };
    eventer = new Eventer();
    revisions: Revision[];
    status: DocumentStatus;
    selected: boolean;

    fromJSON(data) {
        if(!data){
            this.status = DocumentStatus.initial;
            return;
        }

        this.status = DocumentStatus.loaded;
        if (data.metadata) {
            var dotSplit = data.metadata.filename.split('.');
            if (dotSplit.length > 1) {
                dotSplit.length = dotSplit.length - 1;
            }
            this.title = dotSplit.join('.');
			this.metadata.role = this.role();
        }

        if (data.created) {
            this.created = moment(data.created.split('.')[0]);
        }
		else if(data.sent){
			this.created = moment(data.sent.split('.')[0]);
        }
        else {
            this.created = moment();
        }

		this.owner = { userId: data.owner };

		this.version = parseInt(Math.random() * 100);
		this.link = '/workspace/document/' + this._id;
		if(this.metadata.role === 'img'){
			this.icon = this.link;
		}
		this.revisions = [];
    }

	async refreshHistory(){
        const response = await http.get("document/" + this._id + "/revisions");
        const revisions = response.data;
        this.revisions = Mix.castArrayAs(Revision, revisions);
    }

    upload(file: File | Blob, visibility?: 'public' | 'protected'): Promise<any> {
        if (!visibility) {
            visibility = 'protected';
        }
        this.status = DocumentStatus.loading;
        var formData = new FormData();
        formData.append('file', file, file.name);
        this.title = file.name;
        const xhr = new XMLHttpRequest();
        xhr.open('POST', '/workspace/document?' + visibility + '=true&application=media-library&quality=1&' + MediaLibrary.thumbnails);
        xhr.send(formData);
        xhr.onprogress = (e) => {
            this.eventer.trigger('progress', e);
        }

        return new Promise((resolve, reject) => {
            xhr.onload = () => {
                this.eventer.trigger('loaded');
                resolve();
                this.status = DocumentStatus.loaded;
                const result = JSON.parse(xhr.responseText);
                this._id = result._id;
            }
            xhr.onerror = () => {
                this.eventer.trigger('error');
                var error = JSON.parse(xhr.responseText);
                notify.error(error.error);
                this.status = DocumentStatus.failed;
            }
        });
    }

    role() {
        return Document.role(this.metadata['content-type']);
    }

    protectedDuplicate(callback?: (document: Document) => void): Promise<Document> {
        return new Promise((resolve, reject) => {
            Behaviours.applicationsBehaviours.workspace.protectedDuplicate(this, function (data) {
                resolve(Mix.castAs(Document, data));
            });
        });
    }

    publicDuplicate(callback?: (document: Document) => void) {
        return new Promise((resolve, reject) => {
            Behaviours.applicationsBehaviours.workspace.publicDuplicate(this, function (data) {
                resolve(Mix.castAs(Document, data));
            });
        });
    }

    static role(fileType) {
        if (!fileType)
            return 'unknown'

        var types = {
            'doc': function (type) {
                return type.indexOf('document') !== -1 && type.indexOf('wordprocessing') !== -1;
            },
            'xls': function (type) {
                return (type.indexOf('document') !== -1 && type.indexOf('spreadsheet') !== -1) || (type.indexOf('ms-excel') !== -1);
            },
            'img': function (type) {
                return type.indexOf('image') !== -1;
            },
            'pdf': function (type) {
                return type.indexOf('pdf') !== -1 || type === 'application/x-download';
            },
            'ppt': function (type) {
                return (type.indexOf('document') !== -1 && type.indexOf('presentation') !== -1) || type.indexOf('powerpoint') !== -1;
            },
            'video': function (type) {
                return type.indexOf('video') !== -1;
            },
            'audio': function (type) {
                return type.indexOf('audio') !== -1;
            },
            'zip': function (type) {
                return type.indexOf('zip') !== -1 ||
                    type.indexOf('rar') !== -1 ||
                    type.indexOf('tar') !== -1 ||
                    type.indexOf('7z') !== -1;
            }
        };

        for (let type in types) {
            if (types[type](fileType)){
                return type;
            }
        }

        return 'unknown';
    }

    async trash(): Promise<any> {
        const response = await http.put('/workspace/document/trash/' + this._id);
    }
}

export class Folder implements Selectable{

    selected: boolean;
    folders = new Selection<Folder>([]);
    documents = new Selection<Document>([]);
    folder: string;

    closeFolder(){
        this.folders.all = [];
    };
    
    async sync(){
        this.folders.all.splice(0, this.folders.all.length);
        this.folders.addRange(MediaLibrary.myDocuments.folders.filter((folder) => folder.folder.indexOf(this.folder + '_') !== -1));
        const response = await http.get('/workspace/documents/' + this.folder + '?filter=owner&hierarchical=true');
        this.documents.all.splice(0, this.documents.all.length);
        this.documents.addRange(Mix.castArrayAs(Document, response.data.filter(doc => doc.folder !== 'Trash')));
        MediaLibrary.eventer.trigger('sync');
    }
}

export class MyDocuments extends Folder{
    async sync(){
        this.folders.all.splice(0, this.folders.all.length);
        const response = await http.get('/workspace/folders/list?filter=owner');
        this.folders.addRange(response.data.filter((folder) => folder.folder.indexOf('_') === -1 ));
        this.documents.all.splice(0, this.documents.all.length);
        const docResponse = await http.get('/workspace/documents?filter=owner&hierarchical=true');
        this.documents.addRange(Mix.castArrayAs(Document, docResponse.data.filter(doc => doc.folder !== 'Trash')));
        MediaLibrary.eventer.trigger('sync');
    }
}

class SharedDocuments extends Folder{
    async sync(){
        this.documents.all.splice(0, this.documents.all.length);
        const docResponse = await http.get('/workspace/documents?filter=shared');
        this.documents.addRange(Mix.castArrayAs(Document, docResponse.data.filter(doc => doc.folder !== 'Trash')));
        MediaLibrary.eventer.trigger('sync');
    }
}

class AppDocuments extends Folder{
    async sync(){
        this.documents.all.splice(0, this.documents.all.length);
        const docResponse = await http.get('/workspace/documents?filter=protected');
        this.documents.addRange(Mix.castArrayAs(Document, docResponse.data.filter(doc => doc.folder !== 'Trash')));
        MediaLibrary.eventer.trigger('sync');
    }
}

class PublicDocuments extends Folder{
    async sync(){
        this.documents.all.splice(0, this.documents.all.length);
        const docResponse = await http.get('/workspace/documents?filter=public');
        this.documents.addRange(Mix.castArrayAs(Document, docResponse.data.filter(doc => doc.folder !== 'Trash')));
        MediaLibrary.eventer.trigger('sync');
    }
}

export class MediaLibrary{
    static myDocuments = new MyDocuments();
    static sharedDocuments = new SharedDocuments();
    static appDocuments = new AppDocuments();
    static publicDocuments = new PublicDocuments();
    static eventer = new Eventer();

    static thumbnails = "thumbnail=120x120&thumbnail=150x150&thumbnail=100x100&thumbnail=290x290&thumbnail=48x48&thumbnail=82x82&thumbnail=381x381&thumbnail=1600x0";

    static async upload (file: File | Blob, visibility?: 'public' | 'protected'): Promise<Document>{
        if(!visibility){
            visibility = 'protected';
        }

        const doc = new Document();
        await doc.upload(file, visibility);
        return doc;
    }
}

if (!(window as any).entcore) {
    (window as any).entcore = {};
}
(window as any).entcore.quota = quota;