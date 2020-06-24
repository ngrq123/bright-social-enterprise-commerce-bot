# Need to pip install dnspython
from pymongo import MongoClient

import os
from dotenv import load_dotenv
from pathlib import Path

import requests

env_path = Path('.') / '.env'
load_dotenv(dotenv_path=env_path)

mongo_pw = os.getenv('DB_PASSWORD')
page_access_token = os.getenv('PAGE_ACCESS_TOKEN')
uri = "https://graph.facebook.com/v7.0/me/messenger_profile?access_token=" + page_access_token
uri_two = "https://graph.facebook.com/v7.0/me/messenger_profile?fields=ice_breakers&access_token=" + page_access_token

client = MongoClient('mongodb+srv://mongoadmin:' + mongo_pw + '@fb-hack-chatbot-cevnk.mongodb.net/fbmsg', connect=False)

db = client.fbmsg

def get_ice_breaker_content(db):
    icebreaker_collection = db.icebreaker
    
    return list(icebreaker_collection.find({},{'_id':0}))

def submit_ice_breakers(icebreakers):
    payload = {"ice_breakers":icebreakers}

    headers = {"Content-Type":"application/json"}

    resp = requests.post(uri, json=payload, headers=headers)

    print(resp)

def get_ice_breakers():
    headers = {"Content-Type":"application/json"}
    resp = requests.get(uri_two,headers)
    print(resp.text)

icebreakers = get_ice_breaker_content(db)
submit_ice_breakers(icebreakers)
#get_ice_breakers()


