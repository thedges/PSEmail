import {LightningElement, track, api} from 'lwc';
import {ShowToastEvent} from 'lightning/platformShowToastEvent';
import getEmails from '@salesforce/apex/PSEmailController.getEmails';

const COLS = [
  {label: 'Full Name', fieldName: 'name', editable: false},
  {label: 'Title', fieldName: 'title'},
  {label: 'Phone', fieldName: 'phone'},
  {label: 'Email', fieldName: 'email'},
];

export default class PsEmailSelectionField extends LightningElement {
  @track manualEmails = [];
  @api recordId;
  @api allowedDomains;
  @api blockEmails = false;
  @api accountField;
  @track emails;
  @track selectedEmails;
  @track selectedRows = [];
  @track openmodal = false;
  @track columns = COLS;

  openEmailModal () {
    this.openmodal = true;
  }
  closeEmailModal () {
    this.openmodal = false;
  }

  addEmails () {
    this.openEmailModal ();
  }

  @api
  clear() {
    console.log('clear invoked...');
    this.selectedEmails = [];
    this.selectedRows = [];
    this.manualEmails = [];
  }

  removePill (event) {
    console.log ('removePill=' + JSON.stringify (event));
    console.log ('event.name=' + event.detail.name);
    this.selectedEmails = this.selectedEmails.filter (function (
      value,
      index,
      arr
    ) {
      console.log ('value.id=' + value.id);
      console.log ('event.name=' + event.detail.name);
      return value.id != event.detail.name;
    });

    this.processEmails ();
  }

  removeManualPill (event) {
    console.log ('removeManualPill=' + JSON.stringify (event));
    console.log ('event.name=' + event.detail.name);
    this.manualEmails = this.manualEmails.filter (function (value, index, arr) {
      return value.email != event.detail.name;
    });

    this.processEmails ();
  }

  inputChange (event) {
    if (event.keyCode == 13) {
      if (event.target.value.indexOf ('@') != -1) {
        const newEmail = event.target.value;
        var clz = '';
        if (this.allowedDomains) {
          const vals = newEmail.split ('@');

          if (!this.allowedDomains.includes (vals[1])) {
            clz = 'outside-domain';


            if (this.blockEmails)
            {
              const event = new ShowToastEvent ({
                title: 'Error!',
                message: 'You have added an email outside allowed domains.',
                variant: 'error',
                mode: 'sticky',
              });
              this.dispatchEvent (event);
            }
            else
            {
              this.manualEmails.push ({email: newEmail, class: clz});

              const event = new ShowToastEvent ({
                title: 'Warning!',
                message: 'You have added an email outside allowed domains.',
                variant: 'warning',
                mode: 'sticky',
              });
              this.dispatchEvent (event);
            }
          }
          else
          {
            this.manualEmails.push ({email: newEmail, class: clz});
          }
        }
        else
        {
          this.manualEmails.push ({email: newEmail, class: clz});
        }
        
        event.target.value = '';
      }
      this.processEmails ();
    }
  }

  setEmails () {
    var self = this;

    var el = this.template.querySelector ('.emailTable');
    this.selectedEmails = el.getSelectedRows ();
    console.log('selectedEmails=' + JSON.stringify(this.selectedEmails));

    this.processEmails ();

    this.closeEmailModal ();
  }

  processEmails () {
    this.selectedRows.length = 0;
    var emailList = [];

    if (this.selectedEmails) {
      this.selectedEmails.forEach (el => {
        this.selectedRows.push (el.id);
        emailList.push (el.email);
      });
    }

    if (this.manualEmails) {
      this.manualEmails.forEach (el => {
        emailList.push (el.email);
      });
    }

    console.log('emailList=' + JSON.stringify(emailList));

    // send event
    const selectedEvent = new CustomEvent ('selected', {detail: emailList});
    this.dispatchEvent (selectedEvent);
  }

  connectedCallback () {
    var self = this;

    getEmails ({recordId: this.recordId, accountField: this.accountField})
      .then (result => {
        console.log ('result=' + result);
        self.emails = JSON.parse (result);
      })
      .catch (error => {
        self.handleError (error);
      });
  }

  handleError (err) {
    console.log ('error=' + err);
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