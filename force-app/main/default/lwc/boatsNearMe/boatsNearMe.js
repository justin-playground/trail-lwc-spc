// imports
import { LightningElement, wire, api } from 'lwc';
import getBoatsByLocation from '@salesforce/apex/BoatDataService.getBoatsByLocation';
import { ShowToastEvent } from 'lightning/platformShowToastEvent'


const LABEL_YOU_ARE_HERE = 'You are here!';
const ICON_STANDARD_USER = 'standard:user';
const ERROR_TITLE = 'Error loading Boats Near Me';
const ERROR_VARIANT = 'error';
export default class BoatsNearMe extends LightningElement {
    @api
    boatTypeId;
    mapMarkers = [];
    isLoading = true;
    isRendered = false;
    // @api
    latitude;
    // @api
    longitude;
    
    // Add the wired method from the Apex Class
    // Name it getBoatsByLocation, and use latitude, longitude and boatTypeId
    // Handle the result and calls createMapMarkers
    @wire(getBoatsByLocation, { latitude: '$latitude', longitude: '$longitude', boatTypeId: '$boatTypeId' })
    wiredBoatsJSON({error, data}) { 
        if (data) {
            this.createMapMarkers(data);
            // this.isLoading = false;
        } else if (error) {
            const event = new ShowToastEvent({
                title: ERROR_TITLE,
                message: error.body.message,
                variant: ERROR_VARIANT
            });
            this.dispatchEvent(event);
            // this.isLoading = false;
        }
        this.isLoading = false;
    }
    
    // Controls the isRendered property
    // Calls getLocationFromBrowser()
    renderedCallback() { 
        if (this.isRendered) {
            return;
        }
        this.isRendered = true;
        this.getLocationFromBrowser();
    }
    
    // Gets the location from the Browser
    // position => {latitude and longitude}
    getLocationFromBrowser() { 
        navigator.geolocation.getCurrentPosition( position => {
            this.latitude = position.coords.latitude;
            this.longitude = position.coords.longitude;
        });
    }
    
    // Creates the map markers
    createMapMarkers(boatData) {
        const boats = JSON.parse(boatData);
        const newMarkers = boats.map(boat => {
            return { 
                title: boat.Name,
                // icon: ICON_STANDARD_USER,
                location: {
                    Latitude: boat.Geolocation__Latitude__s,
                    Longitude: boat.Geolocation__Longitude__s
                } 
            };
        });

        newMarkers.unshift({ 
            title: LABEL_YOU_ARE_HERE, 
            icon: ICON_STANDARD_USER,
            location: {
                Latitude: this.latitude,
                Longitude: this.longitude
            } 
        });

        this.mapMarkers = newMarkers;
        // this.isLoading = false;
    }
}