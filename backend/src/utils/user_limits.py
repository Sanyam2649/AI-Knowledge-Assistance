"""
Utility functions for checking user chat limits and active status.
"""
from datetime import datetime, timedelta
from bson import ObjectId
from configuration.Database import users_collection, chat_sessions_collection


from typing import Tuple

def check_user_active(user_id: str) -> Tuple[bool, str]:
    """
    Check if a user is active.
    
    Args:
        user_id: The user ID to check
        
    Returns:
        Tuple of (is_active: bool, error_message: str)
    """
    try:
        user = users_collection.find_one({"_id": ObjectId(user_id)})
        if not user:
            return False, "User not found"
        
        if not user.get("is_active", True):
            return False, "Your account has been deactivated. Please contact support for assistance."
        
        return True, ""
    except Exception as e:
        return False, f"Error checking user status: {str(e)}"


def get_user_chat_count_in_window(user_id: str, usage_time_window: str = None, 
                                   usage_start_time: datetime = None, 
                                   usage_end_time: datetime = None) -> int:
    now = datetime.utcnow()
    start_time = None
    
    if usage_time_window == "daily":
        start_time = now.replace(hour=0, minute=0, second=0, microsecond=0)
    elif usage_time_window == "weekly":
        # Start of current week (Monday)
        days_since_monday = now.weekday()
        start_time = (now - timedelta(days=days_since_monday)).replace(hour=0, minute=0, second=0, microsecond=0)
    elif usage_time_window == "monthly":
        start_time = now.replace(day=1, hour=0, minute=0, second=0, microsecond=0)
    elif usage_time_window == "custom":
        start_time = usage_start_time
        end_time = usage_end_time
        if start_time and end_time:
            return chat_sessions_collection.count_documents({
                "userId": user_id,
                "createdAt": {
                    "$gte": start_time,
                    "$lte": end_time
                }
            })
    else:
        return chat_sessions_collection.count_documents({"userId": user_id})
    
    if start_time:
        return chat_sessions_collection.count_documents({
            "userId": user_id,
            "createdAt": {"$gte": start_time}
        })
    
    return chat_sessions_collection.count_documents({"userId": user_id})


def check_chat_limit(user_id: str) -> Tuple[bool, str, dict]:
    try:
        user = users_collection.find_one({"_id": ObjectId(user_id)})
        if not user:
            return False, "User not found", {}
        
        chat_limit = user.get("chat_limit")
        usage_time_window = user.get("usage_time_window")
        usage_start_time = user.get("usage_start_time")
        usage_end_time = user.get("usage_end_time")
        
        if chat_limit is None:
            return True, "", {
                "current_count": get_user_chat_count_in_window(user_id, usage_time_window, usage_start_time, usage_end_time),
                "limit": None,
                "usage_time_window": usage_time_window
            }
        
        # Get current count within the time window
        current_count = get_user_chat_count_in_window(
            user_id, 
            usage_time_window, 
            usage_start_time, 
            usage_end_time
        )
        
        if current_count >= chat_limit:
            if usage_time_window == "daily":
                error_msg = f"You have reached your daily chat limit of {chat_limit} sessions. Please try again tomorrow."
            elif usage_time_window == "weekly":
                error_msg = f"You have reached your weekly chat limit of {chat_limit} sessions. Please try again next week."
            elif usage_time_window == "monthly":
                error_msg = f"You have reached your monthly chat limit of {chat_limit} sessions. Please try again next month."
            elif usage_time_window == "custom":
                error_msg = f"You have reached your chat limit of {chat_limit} sessions for the specified time period. Please contact support if you need more sessions."
            else:
                error_msg = f"You have reached your chat limit of {chat_limit} sessions. Please contact support to increase your limit."
            
            return False, error_msg, {
                "current_count": current_count,
                "limit": chat_limit,
                "usage_time_window": usage_time_window
            }
        
        return True, "", {
            "current_count": current_count,
            "limit": chat_limit,
            "usage_time_window": usage_time_window
        }
    except Exception as e:
        return False, f"Error checking chat limit: {str(e)}", {}

