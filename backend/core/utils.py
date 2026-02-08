import subprocess
import platform

def check_ip_availability(ip_address: str, timeout: int = 1000) -> bool:
    """
    Pings the IP address to check if it's reachable.
    Timeout is in milliseconds.
    """
    param = '-n' if platform.system().lower() == 'windows' else '-c'
    
    command = ['ping', param, '1', ip_address]
    if platform.system().lower() == 'windows':
        command.extend(['-w', str(timeout)])
    else:
        command.extend(['-W', str(max(1, timeout // 1000))])

    try:
        response = subprocess.call(
            command,
            stdout=subprocess.DEVNULL,
            stderr=subprocess.DEVNULL
        )
        return response == 0
    except Exception:
        return False
