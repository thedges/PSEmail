import { LightningElement, track, api } from 'lwc';
import {ShowToastEvent} from 'lightning/platformShowToastEvent';
import getTemplates from '@salesforce/apex/PSEmailController.getTemplates';
import getRenderedTemplate from '@salesforce/apex/PSEmailController.getRenderedTemplate';
import sendEmail from '@salesforce/apex/PSEmailController.sendEmail';
import getFromEmails from '@salesforce/apex/PSEmailController.getFromEmails';
import getAllowedEmailDomains from '@salesforce/apex/PSEmailController.getAllowedEmailDomains';
import getAppSetup from '@salesforce/apex/PSEmailController.getAppSetup';


const TEMPLATE_COLS = [
    { label: 'Name', fieldName: 'name', editable: false },
    { label: 'Description', fieldName: 'desc' },
    { label: 'Folder', fieldName: 'folder' }
];


export default class PsEmail extends LightningElement {
    @track emailRichText = 'This is a test';
    chosenTemplate;
    @track allowedDomains;
    @track showSpinner = false;
    @track templateCols = TEMPLATE_COLS;
    @track templates;
    @track fromEmail;
    @track fromEmails;
    @api blockEmails = false;
    @api allowedDomainsField = 'Account.Allowed_Email_Domains__c';
    @api accountField = 'AccountId';
    @api recordId;
    toEmailList;
    ccEmailList;

    
    @track templateModal = false;
    openTemplateModal() {
        this.templateModal = true
    }
    closeTemplateModal() {
        this.templateModal = false
    } 
    setTemplate() {
        var self = this;

        console.log('recordId=' + this.recordId);
        var el = this.template.querySelector('.templateTable');
        var selected = el.getSelectedRows();
        console.log('selected=' + JSON.stringify(selected));

        if (selected)
        {
           console.log('templateId=' + selected[0].id);
        

        getRenderedTemplate({templateId: selected[0].id, recordId: this.recordId}).then(result => {
            console.log('result=' + result);
            var resp = JSON.parse(result);
            self.emailRichText = resp.body;

            const editor = this.template.querySelector('lightning-input-rich-text');
            editor.focus();
            console.log('body=' + JSON.stringify(resp.body.replace(/\n/g, '<br/>').replace(/<\/img>/g,'</img><br/>')));
            editor.value = resp.body.replace(/\n/g, '<br/>').replace(/<\/img>/g,'</img><br/>');

            const subject = this.template.querySelector('.subject');
            subject.value = resp.subject;
          })
          .catch(error => {
             self.handleError(error);
          });

        this.closeTemplateModal();
        }
    }
    


    connectedCallback() {
        var self = this;

        /*
        getTemplates().then(result => {
          console.log('templates=' + result);
          self.templates = JSON.parse(result);
          return getFromEmails();
        })
        .then(result => {
            console.log('fromEmails=' + result);
            self.fromEmails = JSON.parse(result);
            const el = this.template.querySelector('.fromEmail');
            self.fromEmail = self.fromEmails[0].value;
            //el.value = self.fromEmails[0].value;
            return getAllowedEmailDomains({recordId: self.recordId, fieldName: 'Account.Allowed_Email_Domains__c'});
        })
        .then(result => {
          console.log('allowedDoamins=' + result);
          self.allowedDomains = JSON.parse(result);
          
        })
        */
       getAppSetup({recordId: self.recordId, fieldName: self.allowedDomainsField})
       .then(result => {
         console.log('getAppSetup=' + result);
         var pResult = JSON.parse(result);
         self.templates = pResult.templates;
         self.fromEmails = pResult.fromEmails;
         self.allowedDomains = pResult.allowedEmailDomains;

         const el = this.template.querySelector('.fromEmail');
         self.fromEmail = self.fromEmails[0].value;
       })
        .catch(error => {
           self.handleError(error);
        });
    }

    sendEmail() {
      var self = this;

       console.log('fromEmail=' + this.fromEmail);
       var fromDisplay = this.fromEmail;
       this.fromEmails.forEach(item => {
         if (item.value == this.fromEmail) fromDisplay = item.name;
       });
       console.log('fromDisplay=' + fromDisplay);

        console.log('toList=' + JSON.stringify(this.toEmailList));
        console.log('ccList=' + JSON.stringify(this.ccEmailList));

        const subject = this.template.querySelector('.subject');
        console.log('subject=' + subject.value);
        const editor = this.template.querySelector('lightning-input-rich-text');
        console.log('body=' + JSON.stringify(editor.value));
        
        sendEmail({toList: this.toEmailList, ccList: this.ccEmailList, replyTo: this.fromEmail, senderName: fromDisplay, subject: subject.value, body: editor.value, whatId: this.recordId}).then(result => {
          const event = new ShowToastEvent ({
            title: 'Success!',
            message: 'Your email has been sent.',
            variant: 'success',
            mode: 'dismissable',
          });
          this.dispatchEvent (event);

          this.dispatchEvent(new CustomEvent('emailSent'));

          self.clearEmail()
        })
          .catch(error => {
             self.handleError(error);
          });
    }

    clearEmail() {
      this.template.querySelector('.subject').value = '';;
      this.template.querySelector('lightning-input-rich-text').value = '';
      this.template.querySelector('.toEmailList').clear();
      this.template.querySelector('.ccEmailList').clear();

      this.toEmailList = [];
      this.ccEmailList = [];
    }

    handleToList(event) {
      console.log('handleToList=' + JSON.stringify(event.detail));
      this.toEmailList = event.detail;
    }

    handleFromList(event) {
        console.log('handleFromList=' + JSON.stringify(event.detail));
        this.ccEmailList = event.detail;
      }

    handleTemplateChange(event) {
        this.value = event.detail.value;
    }

    handleFromChange(event) {
      console.log('handleFromChange=' + JSON.stringify(event.detail));
      this.fromEmail = event.detail.value;
    }

    selectTemplate(event) {
        this.openTemplateModal();
    }

    handleError (err) {
        console.log ('error=' + JSON.stringify(err));
        console.log ('type=' + typeof err);
        
        this.showSpinner = false;
    
        const event = new ShowToastEvent ({
          title: err.statusText,
          message: err.body.message + ' ' + err.body.stackTrace,
          variant: 'error',
          mode: 'pester',
        });
        this.dispatchEvent (event);
      }
}