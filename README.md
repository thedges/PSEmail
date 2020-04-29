# PSEmail

THIS SOFTWARE IS COVERED BY [THIS DISCLAIMER](https://raw.githubusercontent.com/thedges/Disclaimer/master/disclaimer.txt).

This is demo component to show creating emails with warning or blocking the To and CC list to contacts that are related to related account. This specific demo use case was to not allow sending emails outside those related to current account or were in an approved domain list. This component can be placed on any object as long as you have relationship to account object.

Here is the demo component in action:

![alt text](https://github.com/thedges/PSEmail/blob/master/PSEmail.gif "PSEmail")

Here are the main configuration options:

| Parameter  | Definition |
| ------------- | ------------- |
| Block Emails | Boolean option to either block or warn on email addresses outside domain |
| Allowed Domains Field  | The field API name on the account object that includes comma separated list of allowed domains |
| Account Field | The field API name on the object that is lookup/master-detail to the account object |

# Quick Actions
While this Lightning Web Component can be placed on an record page and configured as needed, sometimes you may want to launch the email editor from a quick action. Two sample quick actions have been created for reference.

  * __PSEmailBlock__ - this is configured to block email addresses not related to account and outside defined domains
  * __PSEmailWarning__ -  this is configured to block email addresses not related to account and outside defined domains
  
For reference, here is example of configuring the PSEmailBlock as quick action

![alt text](https://github.com/thedges/PSEmail/blob/master/PSEmailBlockAction.png "PSEmailBlockAction")

# Setup Instructions
Here are steps to setup and configure this component:
  * Install the component per the "Deploy to Salesforce" button below. 
  * Assign the __PSEmail__ permission set to any user that will use this component.
  * If you are using the component directly on a page, just add the component to page and configure the 3 options as defined above.
  * If you are using the component as a quick action, use one of the provided Aura components listed above (PSEmailBlock or PSEmailWarning) or create your own Aura version as the base for the quick action. Create the quick action as shown in sample screen above and add the quick action to your page layout.
  * That is it...now use either the Quick Action or Lightning Component depending on your choice of setup.

# Installation Instructions

Click below button to install this package:

<a href="https://githubsfdeploy.herokuapp.com">
  <img alt="Deploy to Salesforce"
       src="https://raw.githubusercontent.com/afawcett/githubsfdeploy/master/deploy.png">
</a>
