import { Component, Input, OnInit } from '@angular/core';
import { IWorkpackJournalInformation } from '../../interfaces/IJournal';
import { AuthService } from '../../services/auth.service';

@Component({
  selector: 'app-card-journal-information',
  templateUrl: './card-journal-information.component.html',
  styleUrls: ['./card-journal-information.component.scss']
})
export class CardJournalInformationComponent implements OnInit {

  @Input() information: IWorkpackJournalInformation;

  constructor(
    private authService: AuthService
  ) { }

  ngOnInit(): void {
  }

  handleDownload(dataurl: string, filename: string, mimeType) {
    const accessToken = this.authService.getAccessToken();
    const header = {
      method: 'GET',
      headers: new Headers({
        Authorization: 'Bearer ' + accessToken
      })
    };
    fetch(dataurl, header)
      .then(response => response.blob())
      .then(blob => {
        const fileBlob = new Blob([blob], {type: mimeType})
        const link = document.createElement('a');
        link.href = URL.createObjectURL(fileBlob);
        link.download = filename;
        link.click();
      })
      .catch(console.error);
  }

}
