import subprocess
import sys
import os
import time

def main():
    print("=" * 65)
    print("  Sentinel Wellness — Personnel Welfare Early-Warning System")
    print("=" * 65)
    print("\n[1/2] Starting FastAPI Backend on http://127.0.0.1:8000 ...")
    
    backend_dir = os.path.join(os.path.dirname(__file__), "backend")
    frontend_dir = os.path.join(os.path.dirname(__file__), "frontend")
    
    # Launch uvicorn server
    backend_process = subprocess.Popen(
        [sys.executable, "-m", "uvicorn", "app.main:app", "--host", "127.0.0.1", "--port", "8000", "--reload"],
        cwd=backend_dir
    )
    
    time.sleep(2)
    print("[2/2] Starting Frontend Vite Dev Server on http://localhost:3000 ...")
    
    frontend_process = subprocess.Popen(
        ["npx.cmd" if os.name == "nt" else "npx", "vite", "--port", "3000"],
        cwd=frontend_dir
    )
    
    print("\n✅ Sentinel Wellness System is Live!")
    print("  • Frontend UI: http://localhost:3000")
    print("  • Backend API Docs: http://127.0.0.1:8000/docs")
    print("  • Press Ctrl+C to terminate both servers.")
    print("=" * 65)
    
    try:
        backend_process.wait()
        frontend_process.wait()
    except KeyboardInterrupt:
        print("\nShutting down Sentinel Wellness servers...")
        backend_process.terminate()
        frontend_process.terminate()

if __name__ == "__main__":
    main()
