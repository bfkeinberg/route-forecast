import logging
from flask import redirect
from flask import url_for
from stravalib.client import Client


class StravaActivity:
    CLIENT_ID = 21996

    def __init__(self,client_secret,session):
        self.logger = logging.getLogger('StravaActivity')
        self.client_secret = client_secret
        self.session = session
        logging.basicConfig(level=logging.INFO)

    def authenticate(self,host_url,state):
        client = Client(requests_session=self.session)
        # chop last character of host url to avoid double slash in middle of url
        authorize_url = client.authorization_url(client_id=self.CLIENT_ID,
                                                 redirect_uri=host_url[:-1] + url_for('handle_strava_auth_response'),
                                                 state=state)
        self.logger.info('Redirect: %s', host_url[:-1] + url_for('handle_strava_auth_response'))
        return redirect(authorize_url)

    def get_token(self,code):
        client = Client(requests_session=self.session)
        return client.exchange_code_for_token(self.CLIENT_ID, self.client_secret, code)

