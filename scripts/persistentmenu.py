# Need to pip install dnspython
from pymongo import MongoClient

import os
from dotenv import load_dotenv
from pathlib import Path
import json

import requests

env_path = Path('../') / '.env'
load_dotenv(dotenv_path=env_path)

mongo_pw = os.getenv('DB_PASSWORD')
page_access_token = os.getenv('PAGE_ACCESS_TOKEN')
uri = "https://graph.facebook.com/v7.0/me/messenger_profile?access_token=" + page_access_token
uri_two = "https://graph.facebook.com/v7.0/me/messenger_profile?fields=persistent_menu&access_token=" + page_access_token
headers = {"Content-Type":"application/json"}

client = MongoClient('mongodb+srv://mongoadmin:' + mongo_pw + '@fb-hack-chatbot-cevnk.mongodb.net/fbmsg', connect=False)

db = client.fbmsg

# Pulls the content for the persistent menu from database
def get_persistent_menu_content(db):
    persistent_menu_collection = db.persistentmenu
    
    return list(persistent_menu_collection.find({},{'_id':0}))

# This is to perform post request with facebook API to set the persistent menu for each user
def submit_persistent_menus(persistentmenus):

    persist_menu = {"locale": "default",
            "composer_input_disabled": False,
            "call_to_actions":persistentmenus}
    payload = {"persistent_menu": [persist_menu]}

    resp = requests.post(uri, json=payload, headers=headers)

    print(resp.text)

def get_persistent_menu():
    resp = requests.get(uri_two,headers)
    print(resp.text)

persistentmenus = get_persistent_menu_content(db)
submit_persistent_menus(persistentmenus)
get_persistent_menu()


