public without sharing class PSEmailController {

    @AuraEnabled
    public static String getAppSetup(String recordId, String fieldName)
    {
        Map<String,Object> resp = new Map<String,Object>();

        String objectName = ID.valueOf(recordId).getSObjectType().getDescribe().getName();

        ///////////////////
        // get templates //
        ///////////////////
        List<Map<String,Object>> temps = new List<Map<String,Object>>();
        for (EmailTemplate temp : [SELECT Id, Name, Description, FolderName
                                          FROM EmailTemplate
                                          WHERE isActive = true
                                           ORDER BY Name ASC])
        {
            Map<String,Object> t = new Map<String,Object>();
            t.put('id', temp.Id);
            t.put('name', temp.Name);
            t.put('desc', temp.Description);
            t.put('folder', temp.FolderName);
            temps.add(t);
        }

        resp.put('templates', temps);

        //////////////////////////////
        //get allowed email domains //
        //////////////////////////////
        List<String> allowedEmailDomains = new List<String>();

        String soql = 'SELECT ' + fieldName + ' FROM ' + objectName + ' WHERE ID = \'' + recordId + '\'';
        List<SObject> objList = Database.query(soql);

        if (objList != null && objList.size() > 0)
        {
            String val = (String)getSobjectValue(objList[0], fieldName);
            if (val != null) allowedEmailDomains = val.split(',');
        }

        resp.put('allowedEmailDomains', allowedEmailDomains);

/*
        ////////////////
        // get emails //
        ////////////////
        List<Map<String, String>> emails = new List<Map<String, String>>();

        if (objectName == 'Case')
        {
            Case cs = [SELECT AccountId FROM Case WHERE Id = :recordId LIMIT 1];

            List<Contact> contactList= [SELECT Id, Name, Title, Email, Phone, MobilePhone FROM Contact WHERE AccountId = :cs.AccountId];

            for (Contact c : contactList)
            {
                Map<String, String> det = new Map<String, String>();
                det.put('id', c.Id);
                det.put('name', c.Name);
                det.put('title', c.Title);
                det.put('email', c.Email);
                det.put('phone', c.Phone);
                emails.add(det);
            }
        }

        resp.put('emails', emails);
        */

        /////////////////////
        // get from emails //
        /////////////////////
        List<Map<String, String>> fromEmails = new List<Map<String, String>>();

        Map<String, String> el = new Map<String, String>();
        el.put('label', UserInfo.getName() + ' <' + UserInfo.getUserEmail() + '>');
        el.put('value', UserInfo.getUserEmail());
        el.put('name', UserInfo.getName());
        fromEmails.add(el);

        for (OrgWideEmailAddress o : [SELECT Id, Address, DisplayName FROM OrgWideEmailAddress ORDER BY DisplayName ASC])
        {
            el = new Map<String, String>();
            el.put('label', o.DisplayName + ' <' + o.Address + '>');
            el.put('value', o.Address);
            el.put('name', o.DisplayName);
            fromEmails.add(el);
        }

        resp.put('fromEmails', fromEmails);


        return JSON.serializePretty(resp);

    }


    @AuraEnabled
    public static String getTemplates()
    {
        List<Map<String,Object>> resp = new List<Map<String,Object>>();
        for (EmailTemplate temp : [SELECT Id, Name, Description, FolderName
                                          FROM EmailTemplate
                                          WHERE isActive = true
                                           ORDER BY Name ASC])
        {
            Map<String,Object> t = new Map<String,Object>();
            t.put('id', temp.Id);
            t.put('name', temp.Name);
            t.put('desc', temp.Description);
            t.put('folder', temp.FolderName);
            resp.add(t);
        }

        return JSON.serialize(resp);
    }

    @AuraEnabled
    public static String getAllowedEmailDomains(String recordId, String fieldName)
    {
        List<String> resp = new List<String>();

        String objectName = ID.valueOf(recordId).getSObjectType().getDescribe().getName();
        String soql = 'SELECT ' + fieldName + ' FROM ' + objectName + ' WHERE ID = \'' + recordId + '\'';
        List<SObject> objList = Database.query(soql);

        if (objList != null && objList.size() > 0)
        {
            String val = (String)getSobjectValue(objList[0], fieldName);
            resp = val.split(',');
        }

        return JSON.serialize(resp);
    }

    public static Object getSobjectValue(SObject obj, String fieldname)
    {
        Object retVal;

        if (fieldname.indexOf('.') != -1)
        {
            List<String> flds = fieldname.split('\\.');
            Integer i=1;

            for (String fld : flds)
            {
                if (i++ == flds.size())
                {
                    retVal = obj.get(fld);
                }
                else {
                    obj = (SObject)obj.getSObject(fld);
                }
            }

        }
        else {
            retVal = obj.get(fieldname);
        }

        return retVal;
    }


    @AuraEnabled
    public static String getRenderedTemplate(String templateId, String recordId)
    {
        Map<String,String> resp = new Map<String,String>();

        Messaging.SingleEmailMessage email = Messaging.renderStoredEmailTemplate(templateId, null, recordId);

        resp.put('subject', email.getSubject());
        if (email.getHTMLBody() != null)
        {
            resp.put('body', email.getHTMLBody());
        }
        else {
            resp.put('body', email.getPlainTextBody());
        }

        return JSON.serialize(resp);
    }

    @AuraEnabled
    public static void sendEmail(List<String> toList, List<String> ccList, String replyTo, String senderName, String subject, String body, String whatId)
    {
        Messaging.SingleEmailMessage mail = new Messaging.SingleEmailMessage();

        mail.setToAddresses(toList);
        if (ccList != null)
        {
        mail.setCcAddresses(ccList);
        }
        String[] ccAddresses = new String[] {'smith@gmail.com'};

        mail.setReplyTo(replyTo);
        mail.setSenderDisplayName(senderName);
        mail.setWhatId(whatId);

        mail.setSubject(subject);

        mail.setUseSignature(true);
        mail.setSaveAsActivity(true);
        mail.optOutPolicy = 'FILTER';

        mail.setHtmlBody(body);

        Messaging.sendEmail(new Messaging.SingleEmailMessage[] { mail });
    }

    @AuraEnabled
    public static String getEmails(String recordId, String accountField)
    {
        List<Map<String, String>> resp = new List<Map<String, String>>();

        String objectName = ID.valueOf(recordId).getSObjectType().getDescribe().getName();
        String soql = 'SELECT ' + accountField + ' FROM ' + objectName + ' WHERE ID = \'' + recordId + '\'';
        List<SObject> objList = Database.query(soql);
        if (objList != null && objList.size() > 0)
        {
            String accountId = (String)objList[0].get(accountField);
            List<Contact> contactList= [SELECT Id, Name, Title, Email, Phone, MobilePhone FROM Contact WHERE AccountId = :accountId];

            for (Contact c : contactList)
            {
                Map<String, String> det = new Map<String, String>();
                det.put('id', c.Id);
                det.put('name', c.Name);
                det.put('title', c.Title);
                det.put('email', c.Email);
                det.put('phone', c.Phone);
                resp.add(det);
            }
        }

        return JSON.serialize(resp);
    }

    @AuraEnabled
    public static String getFromEmails()
    {
        List<Map<String, String>> resp = new List<Map<String, String>>();

        Map<String, String> el = new Map<String, String>();
        el.put('label', UserInfo.getName() + ' <' + UserInfo.getUserEmail() + '>');
        el.put('value', UserInfo.getUserEmail());
        el.put('name', UserInfo.getName());
        resp.add(el);

        for (OrgWideEmailAddress o : [SELECT Id, Address, DisplayName FROM OrgWideEmailAddress ORDER BY DisplayName ASC])
        {
            el = new Map<String, String>();
            el.put('label', o.DisplayName + ' <' + o.Address + '>');
            el.put('value', o.Address);
            el.put('name', o.DisplayName);
            resp.add(el);
        }

        return JSON.serialize(resp);
    }

}