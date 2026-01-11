from typing import Any, Text, Dict, List
from rasa_sdk import Action, Tracker
from rasa_sdk.executor import CollectingDispatcher
from rasa_sdk.events import SlotSet
import requests

API_BASE = "https://toy.pequla.com/api"

def normalize(text: str) -> str:
    return text.lower().strip()

def map_target_group(value: str) -> str:
    """Maps English user input to Serbian API values."""
    if not value:
        return "svi"

    mapping = {
        "boys": "dečak",
        "boy": "dečak",
        "girls": "devojčica",
        "girl": "devojčica",
        "kids": "svi",
        "children": "svi",
        "all": "svi"
    }
    return mapping.get(value.lower(), "svi")


def age_matches(age_group_name: str, requested_age: float) -> bool:
    """
    Checks if requested_age falls into age_group_name range (e.g., "3-5")
    """
    try:
        min_age, max_age = age_group_name.split("-")
        return int(min_age) <= requested_age <= int(max_age)
    except Exception:
        return False

class ActionListToys(Action):
    def name(self) -> Text:
        return "action_list_toys"

    def run(
        self,
        dispatcher: CollectingDispatcher,
        tracker: Tracker,
        _,
    ) -> List[Dict[Text, Any]]:

        raw_target = tracker.get_slot("target_group")
        age = tracker.get_slot("age")
        price = tracker.get_slot("price")
        release_year = tracker.get_slot("release_year")
        api_target = map_target_group(raw_target)

        # convert age and price to numbers if they exist
        if age:
            try:
                age = float(age)
            except Exception:
                age = None
        if price:
            try:
                price = float(price)
            except Exception:
                price = None

        try:
            rsp = requests.get(f"{API_BASE}/toy")
            rsp.raise_for_status()
            toys = rsp.json()
        except Exception:
            dispatcher.utter_message("❌ I can't load toys right now.")
            return []

        filtered = toys

        # --- FILTERS ---
        if api_target != "svi":
            filtered = [t for t in filtered if t.get("targetGroup") in (api_target, "svi")]

        if age:
            filtered = [
                t for t in filtered
                if t.get("ageGroup") and age_matches(t["ageGroup"]["name"], age)
            ]

        if price:
            filtered = [t for t in filtered if t.get("price") is not None and t["price"] <= price]

        if release_year:
            filtered = [
                t for t in filtered
                if t.get("productionDate") and int(t["productionDate"][:4]) == int(release_year)
            ]

        if not filtered:
            dispatcher.utter_message("😕 No toys found with those criteria.")
            return []

        # Send toy list with standardized filter keys for Angular frontend
        dispatcher.utter_message(
            json_message={
                "text": "🧸 Here are the toys that match your search:",
                "attachment": {
                    "type": "toy_list",
                    "data": filtered,
                    "filters": {
                        "targetGroup": api_target,
                        "ageGroup": str(age) if age else None,
                        "priceRange": f"0-{int(price)}" if price else None,
                        "year": str(release_year) if release_year else None
                    }
                }
            }
        )

        return [
            SlotSet("last_toys", filtered),
            SlotSet("age", None),
            SlotSet("price", None),
            SlotSet("release_year", None)
        ]


class ActionToyDetails(Action):
    def name(self) -> Text:
        return "action_toy_details"

    def run(
        self,
        dispatcher: CollectingDispatcher,
        tracker: Tracker,
        _
    ) -> List[Dict[Text, Any]]:

        toys = tracker.get_slot("last_toys")
        toy_name = tracker.get_slot("toy_name")

        if not toys:
            dispatcher.utter_message("Please ask for toys first 😊")
            return []

        if toy_name:
            toy = next(
                (t for t in toys if toy_name.lower() in t["name"].lower()),
                 None
            )
        else:
            toy = toys[0]

        if not toy:
            dispatcher.utter_message("❌ I couldn't find that toy.")
            return []

        toy_id = toy["toyId"]

        try:
            rsp = requests.get(f"{API_BASE}/toy/{toy_id}")
            rsp.raise_for_status()
            toy = rsp.json()
        except Exception:
            dispatcher.utter_message("❌ Failed to load toy details.")
            return []

        dispatcher.utter_message(
            json_message={
                "text": f"🧸 {toy['name']}",
                "attachment": {
                    "type": "open_toy_details",
                    "data": {
                        "toyId": toy["toyId"]
                    }
                }
            }
        )


        return [SlotSet("selected_toy_id", toy_id)]



class ActionAddToCart(Action):
    def name(self) -> Text:
        return "action_add_to_cart"

    def run(
        self,
        dispatcher: CollectingDispatcher,
        tracker: Tracker,
        _
    ) -> List[Dict[Text, Any]]:

        toy_id = tracker.get_slot("selected_toy_id")

        if not toy_id:
            dispatcher.utter_message("Please choose a toy first.")
            return []

        dispatcher.utter_message(
            json_message={
                "text": "✅ Toy added to cart",
                "attachment": {
                    "type": "order_toy",
                    "data": {
                        "toyId": toy_id
                    }
                }
            }
        )
        return []




class ActionListCategories(Action):
    def name(self) -> Text:
        return "action_list_categories"

    def run(self, dispatcher, tracker, _):
        try:
            rsp = requests.get(f"{API_BASE}/toy")
            rsp.raise_for_status()
            toys = rsp.json()
        except Exception:
            dispatcher.utter_message("❌ Can't load categories.")
            return []

        categories = {}
        for toy in toys:
            cat = toy["type"]["name"]
            categories[cat] = categories.get(cat, 0) + 1

        message = "📂 Available categories:\n\n"
        for name, count in categories.items():
            message += f"- {name} ({count})\n"

        dispatcher.utter_message(
            json_message={
                "text": "📂 Available categories:",
                "attachment": {
                    "type": "categories",
                    "data": [
                        {"name": name, "count": count}
                        for name, count in categories.items()
                    ]
                }
            }
        )
        return []
    
class ActionListToysByCategory(Action):
    def name(self) -> Text:
        return "action_list_toys_by_category"

    def run(self, dispatcher, tracker, _):
        category = tracker.get_slot("category_name")

        if not category:
            dispatcher.utter_message("Please choose a category.")
            return []

        try:
            rsp = requests.get(f"{API_BASE}/toy")
            rsp.raise_for_status()
            toys = rsp.json()
        except Exception:
            dispatcher.utter_message("❌ Can't load toys.")
            return []

        filtered = [
            toy for toy in toys
            if normalize(category) in normalize(toy["type"]["name"])
        ]

        if not filtered:
            dispatcher.utter_message("😕 No toys in that category.")
            return []

        dispatcher.utter_message(
            json_message={
                "text": f"🧩 Here are toys from {category}:",
                "attachment": {
                    "type": "toy_list",
                    "data": filtered,
                    "filters": {
                        "category": category   # 👈 OVO DODAJEŠ
                    }
                }
            }
        )

        return [
            SlotSet("last_toys", filtered),
            SlotSet("selected_category", category)
        ]

class ActionReserveEntireOrder(Action):
    def name(self):
        return "action_reserve_entire_order"

    def run(self, dispatcher, tracker, domain):
        dispatcher.utter_message(
            json_message={
                "text": "📦 Reserving your entire order",
                "attachment": {
                    "type": "reserve_entire_order"
                }
            }
        )
        return []

