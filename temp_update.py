import re
import os

files = [
    'c:/Users/moham/Desktop/samba7s/fixtures.html',
    'c:/Users/moham/Desktop/samba7s/results.html',
    'c:/Users/moham/Desktop/samba7s/stats.html',
    'c:/Users/moham/Desktop/samba7s/table.html'
]

replacement = '''<h2 class=\"logo\">
            <img src=\"assets/logo.png\" alt=\"Logo\" style=\"height: 50px;\">
            <div style=\"display: flex; flex-direction: column; align-items: flex-start; margin-top: 5px;\">
                <div style=\"font-family: 'Bebas Neue', sans-serif; line-height: 0.8; color: #eaff00; letter-spacing: -1px; display: flex; align-items: flex-end; text-shadow: 0 0 10px rgba(234, 255, 0, 0.4);\">
                    <span style=\"font-size: 40px; transform: scaleY(1.2);\">SAMBA</span>
                    <span style=\"font-size: 40px; margin-left: 6px; transform: scaleY(1.2);\">26</span>
                </div>
                <div style=\"font-family: 'Inter', sans-serif; font-weight: 800; font-size: 10px; color: #eaff00; letter-spacing: 2.5px; border: 1px solid #eaff00; border-left: none; border-right: none; padding: 2px 4px; margin-top: 6px; background: rgba(0,0,0,0.4); text-transform: uppercase;\">
                    7's Football Tournament
                </div>
            </div>
        </h2>'''

for f in files:
    if os.path.exists(f):
        with open(f, 'r', encoding='utf-8') as file:
            content = file.read()
        
        # Replace the old logo block with the new one using regex DOTALL to match across newlines
        content = re.sub(r'<h2 class=\"logo\">.*?</h2>', replacement, content, flags=re.DOTALL)
        
        with open(f, 'w', encoding='utf-8') as file:
            file.write(content)
        print(f"Updated {f}")
    else:
        print(f"File not found: {f}")
