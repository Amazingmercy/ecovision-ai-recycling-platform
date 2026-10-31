import os
import sys

# Ensure tests NEVER pollute the main / production database with test users:
# Run tests against an isolated, dedicated test database that is torn down after the run
TEST_DB_FILE = "./test_runner_isolated.db"
os.environ["DATABASE_URL"] = f"sqlite:///{TEST_DB_FILE}"

import io
import time
from fastapi.testclient import TestClient
from app.main import app

client = TestClient(app)

def test_full_pipeline():
    print("==================================================================")
    print(" ECOVISION COLLECTION CENTER & USER PORTAL SYSTEM TEST")
    print(" (Running on isolated test environment - main DB untouched)")
    print("==================================================================")

    try:
        print("\n--- 1. Testing Root Frontend Route ---")
        response = client.get("/")
        assert response.status_code == 200
        assert "EcoVision" in response.text
        assert "Collection" in response.text
        print("Frontend served successfully with Collection Center UI (HTTP 200).")

        print("\n--- 2. Testing Secure User Registration ---")
        unique_suffix = int(time.time())
        reg_payload = {
            "username": f"testuser_{unique_suffix}",
            "email": f"testuser_{unique_suffix}@ecovision.org",
            "password": "SecretPassword123",
            "phone_number": "08012345678"
        }
        reg_res = client.post("/api/auth/register", json=reg_payload)
        assert reg_res.status_code == 200, f"Registration failed: {reg_res.text}"
        reg_data = reg_res.json()
        assert "access_token" in reg_data
        assert reg_data["user"]["username"] == reg_payload["username"]
        user_id = reg_data["user"]["id"]
        token = reg_data["access_token"]
        print(f"User registered: ID {user_id}, Username: {reg_data['user']['username']}")

        print("\n--- 3. Testing User Entering Bank Account Details ---")
        account_payload = {
            "bank_name": "Guaranty Trust Bank (GTBank)",
            "account_number": "0123456789",
            "account_name": f"User {unique_suffix} Chukwuma",
            "phone_number": "08098765432"
        }
        acct_res = client.post(
            f"/api/users/{user_id}/account-details",
            headers={"Authorization": f"Bearer {token}"},
            json=account_payload
        )
        assert acct_res.status_code == 200, f"Saving account details failed: {acct_res.text}"
        acct_data = acct_res.json()
        assert acct_data["bank_name"] == account_payload["bank_name"]
        assert acct_data["account_number"] == account_payload["account_number"]
        print(f"Bank details saved: {acct_data['bank_name']} • {acct_data['account_number']} ({acct_data['account_name']})")

        print("\n--- 4. Testing Collection Center Customer Lookup & Search ---")
        search_res = client.get(f"/api/users/search?query={reg_payload['username']}")
        assert search_res.status_code == 200
        search_data = search_res.json()
        assert len(search_data) >= 1
        found_user = next((u for u in search_data if u["id"] == user_id), None)
        assert found_user is not None
        assert found_user["has_account_details"] is True
        print(f"Collection center customer lookup found: {found_user['username']} (Bank on file: {found_user['has_account_details']})")

        print("\n--- 5. Testing Quick Points & Balance Check (Kiosk/Public Lookup) ---")
        qc_res = client.get(f"/api/users/quick-check/{reg_payload['username']}")
        assert qc_res.status_code == 200
        qc_data = qc_res.json()
        assert qc_data["id"] == user_id
        assert qc_data["wallet_points"] == 0
        assert qc_data["bank_name"] == account_payload["bank_name"]
        print(f"Quick check returned: {qc_data['username']}, Balance: {qc_data['wallet_points']} Pts, Bank: {qc_data['bank_name']}")

        print("\n--- 6. Testing Quick-Register Walk-In Customer at Counter ---")
        walkin_payload = {
            "username": f"walkin_{unique_suffix}",
            "email": f"walkin_{unique_suffix}@ecovision.org",
            "phone_number": "08033334444"
        }
        w_reg_res = client.post("/api/users/quick-register", json=walkin_payload)
        assert w_reg_res.status_code == 200, f"Quick register failed: {w_reg_res.text}"
        walkin_user = w_reg_res.json()
        assert walkin_user["username"] == walkin_payload["username"]
        print(f"Walk-in customer registered on the spot: ID {walkin_user['id']}, Username: {walkin_user['username']}")

        print("\n--- 7. Testing Collection Center Waste Photo Intake & YOLO11 Inference ---")
        from PIL import Image, ImageDraw
        img = Image.new("RGB", (960, 960), color=(180, 140, 100))
        draw = ImageDraw.Draw(img)
        draw.rectangle([300, 250, 550, 750], fill=(220, 30, 30), outline=(255, 255, 255), width=4)
        draw.text((360, 480), "Coca-Cola", fill=(255, 255, 255))
        img_byte_arr = io.BytesIO()
        img.save(img_byte_arr, format="JPEG")
        test_img_bytes = img_byte_arr.getvalue()

        files = {"image": ("collection_batch.jpg", io.BytesIO(test_img_bytes), "image/jpeg")}
        form_data = {
            "user_id": str(user_id),
            "collection_center": "Collection Station #1 - Ikeja Hub"
        }
        sub_res = client.post("/api/submissions", data=form_data, files=files)
        assert sub_res.status_code == 200, f"Submission failed: {sub_res.text}"
        sub_data = sub_res.json()
        assert sub_data["user_id"] == user_id
        assert sub_data["collection_center"] == form_data["collection_center"]
        assert sub_data["status"] in ["verified", "rejected", "duplicate_blocked"]
        print(f"Collection Center Intake Receipt #{sub_data['id']}:")
        print(f"  Center: {sub_data['collection_center']}")
        print(f"  Customer: {sub_data['customer_username']}")
        print(f"  Status: {sub_data['status']}")
        print(f"  Plastics Detected: {sub_data.get('plastic_count', sub_data.get('plastics_count', 0))}")
        print(f"  Cans Detected: {sub_data.get('can_count', sub_data.get('cans_count', 0))}")
        print(f"  Points Credited: {sub_data['points_awarded']} Pts (= NGN {sub_data['naira_awarded']:,})")

        print("\n--- 8. Testing Anti-Fraud Duplicate Protection at Collection Center ---")
        dup_files = {"image": ("collection_batch_dup.jpg", io.BytesIO(test_img_bytes), "image/jpeg")}
        dup_res = client.post("/api/submissions", data=form_data, files=dup_files)
        assert dup_res.status_code == 200
        dup_data = dup_res.json()
        assert dup_data["status"] == "duplicate_blocked"
        assert dup_data["points_awarded"] == 0
        print(f"Anti-Fraud duplicate caught! Status: {dup_data['status']}, Points: {dup_data['points_awarded']}")

        print("\n--- 9. Testing User Wallet Summary & Saved Bank Details ---")
        res_wallet = client.get(f"/api/users/{user_id}/wallet")
        assert res_wallet.status_code == 200
        wallet_data = res_wallet.json()
        assert wallet_data["bank_name"] == account_payload["bank_name"]
        assert wallet_data["account_number"] == account_payload["account_number"]
        print(f"User Wallet: {wallet_data['wallet_points']} Points (NGN {wallet_data['wallet_naira']:,})")
        print(f"Saved Bank Destination: {wallet_data['bank_name']} • {wallet_data['account_number']}")

        print("\n--- 10. Testing Withdrawal to User's Saved Bank Account ---")
        if wallet_data["wallet_points"] < 100:
            from app.database import SessionLocal
            import app.models as models
            db = SessionLocal()
            u = db.query(models.User).filter(models.User.id == user_id).first()
            if u:
                u.wallet_points += 150
                db.commit()
            db.close()

        withdraw_res = client.post(
            f"/api/withdrawals?user_id={user_id}",
            json={"points": 100}
        )
        assert withdraw_res.status_code == 200, f"Withdrawal failed: {withdraw_res.text}"
        w_data = withdraw_res.json()
        assert w_data["points_redeemed"] == 100
        assert w_data["naira_amount"] == 1000
        assert w_data["bank_name"] == account_payload["bank_name"]
        assert w_data["account_number"] == account_payload["account_number"]
        print(f"Withdrawal Approved: 100 Points redeemed for NGN {w_data['naira_amount']:,} -> {w_data['bank_name']} ({w_data['account_number']})")

        print("\n==================================================================")
        print(" ALL COLLECTION CENTER & USER PORTAL TESTS PASSED PERFECTLY!")
        print("==================================================================")

    finally:
        # Close test client and teardown test database file
        client.close()
        try:
            from app.database import engine
            engine.dispose()
            if os.path.exists(TEST_DB_FILE):
                os.remove(TEST_DB_FILE)
                print(f"[Isolated Teardown] Removed temporary test database ({TEST_DB_FILE}). Main DB untouched!")
        except Exception as e:
            print(f"[Isolated Teardown] Teardown note: {e}")

if __name__ == "__main__":
    test_full_pipeline()
