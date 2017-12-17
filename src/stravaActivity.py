import json
import logging
import urllib2
from flask import redirect
import requests
from stravalib.client import Client

class StravaActivity:
    # REDIRECT_URI = 'http://www.cyclerouteforecast.com/stravaAuthReply'
    REDIRECT_URI = 'http://localhost:5000/stravaAuthReply'
    CLIENT_ID = 21996

    def __init__(self,client_secret,session):
        self.logger = logging.getLogger('StravaActivity')
        self.client_secret = client_secret
        self.session = session
        logging.basicConfig(level=logging.INFO)

    def set_api_key(self,key):
        self.client_secret = key

    def authenticate(self,state):
        client = Client(requests_session=self.session)
        authorize_url = client.authorization_url(client_id=self.CLIENT_ID, redirect_uri=self.REDIRECT_URI, state=state)
        return redirect(authorize_url)

    def get_token(self,code):
        client = Client(requests_session=self.session)
        return client.exchange_code_for_token(self.CLIENT_ID, self.client_secret, code)

