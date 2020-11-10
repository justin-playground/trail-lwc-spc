import { LightningElement, api, wire, track } from 'lwc';
import { publish, MessageContext } from 'lightning/messageService';
// import BOATMC from the message channel
import BOATMC from '@salesforce/messageChannel/BoatMessageChannel__c';

import updateBoatList from '@salesforce/apex/BoatDataService.updateBoatList';
import getBoats from '@salesforce/apex/BoatDataService.getBoats';
import { ShowToastEvent } from 'lightning/platformShowToastEvent'
import { refreshApex } from '@salesforce/apex';

const SUCCESS_TITLE = 'Success';
const MESSAGE_SHIP_IT = 'Ship it!';
const SUCCESS_VARIANT = 'success';
const ERROR_TITLE   = 'Error';
const ERROR_VARIANT = 'error';


export default class BoatSearchResults extends LightningElement {
    @track selectedBoatId;
    columns = [
        { label: 'Name', fieldName: 'Name', editable: 'true' },
        { label: 'Length', fieldName: 'Length__c', type: 'number', editable: 'true' },
        { label: 'Price', fieldName: 'Price__c', type: 'currency', editable: 'true' },
        { label: 'Description', fieldName: 'Description__c', editable: 'true' }        
    ];
    @track boatTypeId = '';
    boats;
    isLoading = false;
    error = undefined;
    
    // wired message context
    @wire(MessageContext)
    messageContext;

    // wired getBoats method 
    @wire(getBoats, { boatTypeId: '$boatTypeId' })
    wiredBoats(result) {
        this.boats = result;
        if (result.error) {
            this.error = result.error;
            this.boats = undefined;
            const event = new ShowToastEvent({
                title: ERROR_TITLE,
                message: result.error.body.message,
                variant: ERROR_VARIANT
            });
            this.dispatchEvent(event);
        } 
        // console.log(JSON.stringify(result));
        // if (result.data) {
            
        // } else if (result.error) {
        //     const event = new ShowToastEvent({
        //         title: ERROR_TITLE,
        //         message: result.error.body.message,
        //         variant: ERROR_VARIANT
        //     });
        //     this.dispatchEvent(event);
        // }
        this.isLoading = false;
        this.notifyLoading(this.isLoading);
    }
    
    // public function that updates the existing boatTypeId property
    // uses notifyLoading
    @api
    searchBoats(boatTypeId) { 
        this.boatTypeId = boatTypeId;
        this.notifyLoading(true);
    }
    
    // this public function must refresh the boats asynchronously
    // uses notifyLoading
    @api
    async refresh() { 
        this.notifyLoading(true);
        refreshApex(this.boats);
    }
    
    // this function must update selectedBoatId and call sendMessageService
    updateSelectedTile(event) { 
        this.selectedBoatId = event.detail.boatId;
        this.sendMessageService(this.selectedBoatId);
    }
    
    // Publishes the selected boat Id on the BoatMC.
    sendMessageService(boatId) { 
        // explicitly pass boatId to the parameter recordId
        const message = {
            recordId: this.boatId
        };
        publish(this.messageContext, BOATMC, message);
    }
    
    // The handleSave method must save the changes in the Boat Editor
    // passing the updated fields from draftValues to the 
    // Apex method updateBoatList(Object data).
    // Show a toast message with the title
    // clear lightning-datatable draft values
    handleSave(event) {
        // notify loading
        this.notifyLoading(true);

        const updatedFields = event.detail.draftValues;
        // Update the records via Apex
        updateBoatList({data: updatedFields})
        .then(() => {
            this.refresh();
            const event = new ShowToastEvent({
                title: SUCCESS_TITLE,
                message: MESSAGE_SHIP_IT,
                variant: SUCCESS_VARIANT
            });
            this.dispatchEvent(event);
        })
        .catch(error => {
            const event = new ShowToastEvent({
                title: ERROR_TITLE,
                message: error.body.message,
                variant: ERROR_VARIANT
            });
            this.dispatchEvent(event);            
        })
        .finally(() => {
            this.notifyLoading(false);
        });
    }
    // Check the current value of isLoading before dispatching the doneloading or loading custom event
    notifyLoading(isLoading) { 
        this.isLoading = isLoading;
        if (this.isLoading) {
            const loadingEvent = new CustomEvent('loading');
            this.dispatchEvent(loadingEvent);
        } else {
            const doneLoadingEvent = new CustomEvent('doneloading');
            this.dispatchEvent(doneLoadingEvent);
        }
    }
}