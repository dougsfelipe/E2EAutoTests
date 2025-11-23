import io
import zipfile
from typing import List, Dict

def create_project_zip(files: List[Dict[str, str]]) -> io.BytesIO:
    zip_buffer = io.BytesIO()
    
    with zipfile.ZipFile(zip_buffer, "w", zipfile.ZIP_DEFLATED) as zip_file:
        for file_data in files:
            path = file_data["path"]
            content = file_data["content"]
            zip_file.writestr(path, content)
            
    zip_buffer.seek(0)
    return zip_buffer
