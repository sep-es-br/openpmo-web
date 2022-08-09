import { Component, EventEmitter, Input, OnInit, Output, SimpleChanges, OnChanges } from '@angular/core';
import { DomSanitizer } from '@angular/platform-browser';
import { HexBase64BinaryEncoding } from 'crypto';
import { ImageCroppedEvent, LoadedImage } from 'ngx-image-cropper';
import { IFile } from 'src/app/shared/interfaces/IFile';
import { PersonService } from '../../shared/services/person.service';

@Component({
  selector: 'app-avatar',
  templateUrl: './avatar.component.html',
  styleUrls: ['./avatar.component.scss']
})
export class AvatarComponent implements OnInit, OnChanges {

  @Input() idPerson: number;
  @Input() edit = false;
  @Input() avatar: IFile;
  @Input() menu = false;
  @Output() changeAvatar = new EventEmitter();
  @Output() deleteAvatar = new EventEmitter();

  modalImgAvatarUpload = false;
  hasAvatar = false;
  avatarFile: IFile = {};
  resizableImgAvatar: boolean;
  imageChangedEvent: any;
  croppedImageAvatar: string;
  urlViewDocument;

  constructor(
    private personSrv: PersonService,
    private sanatize: DomSanitizer
  ) { }

  async ngOnInit() {
    await this.redirectSetAvatarStatus();
  }

  async ngOnChanges(changes: SimpleChanges) {
    if ((changes.idPerson && changes.idPerson.currentValue) || (changes.avatar && changes.avatar.currentValue)) {
      await this.redirectSetAvatarStatus();
    }
  }

  async redirectSetAvatarStatus() {
    if (this.idPerson) {
      await this.setAvatarPerson();
    }
    if (this.avatar) {
      this.avatarFile = this.avatar;
      this.hasAvatar = true;
    }
  }

  async setAvatarPerson() {
    if (this.idPerson) {
      const result = await this.personSrv.getAvatar(this.idPerson);
      if (result.success && result.data) {
        if (Object.keys(result.data).length > 0) {
          this.avatarFile = result.data;
          this.hasAvatar = true;
        }
      }
    }
  }

  handleUploadAvatarModal() {
    this.modalImgAvatarUpload = true;
  }

  async uploadHandler(data, uploader) {
    this.avatarFile = data.files[0];
    this.imageChangedEvent = data;
    uploader.clear();
    this.resizableImgAvatar = true;
  }

  imageCropped(event: ImageCroppedEvent) {
    this.croppedImageAvatar = event.base64;
  }

  getSizeFormatted(tamanho: string): string {
    if (tamanho.length > 3) {
      const t1 = tamanho.slice(0, tamanho.length - 3);
      const t2 = tamanho.slice(tamanho.length - 3, tamanho.toString().length);
      return `${t1}.${t2} KB`;
    } else {
      return `${tamanho} Bytes`;
    }
  }

  async handleDeleteAvatar() {
    this.deleteAvatar.emit();
    this.resizableImgAvatar = false;
    this.modalImgAvatarUpload = false;
    this.hasAvatar = false;
  }

  resetImageAvatar() {
    this.croppedImageAvatar = null;
    this.avatarFile = {};
    this.resizableImgAvatar = false;
    this.modalImgAvatarUpload = false;
  }

  async handleCancel() {
    this.resetImageAvatar();
    await this.setAvatarPerson();
  }

  async handleSave() {
    const formData: FormData = new FormData();
    const fileBase64 = this.croppedImageAvatar;
    const fileBlob = this.DataURIToBlob(fileBase64);
    const url = window.URL.createObjectURL(fileBlob);
    this.urlViewDocument = this.sanatize.bypassSecurityTrustResourceUrl(url);
    formData.append('file', fileBlob, this.avatarFile.name);
    this.changeAvatar.emit({
      formData,
      hasAvatar: this.hasAvatar
    });
    this.resizableImgAvatar = false;
    this.modalImgAvatarUpload = false;
    this.hasAvatar = true;
  }

  DataURIToBlob(dataURI: string) {
    const splitDataURI = dataURI.split(',');
    const byteString = splitDataURI[0].indexOf('base64') >= 0 ? atob(splitDataURI[1]) : decodeURI(splitDataURI[1]);
    const mimeString = splitDataURI[0].split(':')[1].split(';')[0];

    const ia = new Uint8Array(byteString.length);
    for (let i = 0; i < byteString.length; i++) { ia[i] = byteString.charCodeAt(i); };

    return new Blob([ia], { type: mimeString });
  }
}
