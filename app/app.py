from flask import Flask, render_template, request, jsonify, session, redirect, url_for
from functools import wraps
import json, os, datetime

app = Flask(__name__)
app.secret_key = 'techops-secret-key-2024'

# ─── In-memory database ───────────────────────────────────────────────────────

USERS = {
    'admin': {'password': 'admin123', 'role': 'Administrator', 'name': 'Alex Admin'},
    'user':  {'password': 'user123',  'role': 'Standard User',  'name': 'Sam Standard'},
}

PROJECTS = [
    {'id': 1,  'name': 'Cloud Migration Phase 1',    'client': 'Acme Corp',       'status': 'In Progress',  'start': '2025-01-10', 'deadline': '2025-06-30', 'budget': 120000, 'lead': 'Jordan Lee',   'progress': 45},
    {'id': 2,  'name': 'ERP Implementation',          'client': 'BlueSky Ltd',     'status': 'In Progress',  'start': '2025-02-01', 'deadline': '2025-09-15', 'budget': 250000, 'lead': 'Morgan Chen',  'progress': 30},
    {'id': 3,  'name': 'Network Infrastructure Upgrade','client':'TechPrime Inc',  'status': 'Completed',    'start': '2024-10-01', 'deadline': '2025-02-28', 'budget': 85000,  'lead': 'Riley Scott',  'progress': 100},
    {'id': 4,  'name': 'Cybersecurity Audit',          'client': 'FinSecure Bank', 'status': 'Not Started',  'start': '2025-07-01', 'deadline': '2025-08-31', 'budget': 40000,  'lead': 'Alex Kim',     'progress': 0},
    {'id': 5,  'name': 'DevOps Pipeline Setup',        'client': 'StartupXYZ',     'status': 'In Progress',  'start': '2025-03-15', 'deadline': '2025-05-01', 'budget': 30000,  'lead': 'Jordan Lee',   'progress': 70},
    {'id': 6,  'name': 'Data Warehouse Build',         'client': 'RetailMax',      'status': 'On Hold',      'start': '2025-01-20', 'deadline': '2025-07-20', 'budget': 175000, 'lead': 'Morgan Chen',  'progress': 15},
    {'id': 7,  'name': 'IT Helpdesk System',           'client': 'GlobalEdge',     'status': 'Completed',    'start': '2024-11-01', 'deadline': '2025-01-31', 'budget': 22000,  'lead': 'Riley Scott',  'progress': 100},
    {'id': 8,  'name': 'Mobile App Development',       'client': 'HealthTrack',    'status': 'Cancelled',    'start': '2025-02-10', 'deadline': '2025-06-10', 'budget': 95000,  'lead': 'Alex Kim',     'progress': 10},
    {'id': 9,  'name': 'Disaster Recovery Planning',   'client': 'Acme Corp',      'status': 'In Progress',  'start': '2025-04-01', 'deadline': '2025-06-01', 'budget': 55000,  'lead': 'Jordan Lee',   'progress': 20},
]

PARTNERS = [
    {'id': 1,  'company': 'Dell Technologies',    'contact': 'Sarah Mills',    'email': 'smills@dell.com',      'phone': '+1-512-338-4400', 'country': 'USA',        'type': 'OEM',      'capabilities': 'Servers, Workstations, Storage',          'lead_time': '2-4 weeks',  'notes': 'Preferred hardware vendor'},
    {'id': 2,  'company': 'Cisco Systems',         'contact': 'David Park',     'email': 'dpark@cisco.com',      'phone': '+1-408-526-4000', 'country': 'USA',        'type': 'OEM',      'capabilities': 'Networking, Security, Collaboration',     'lead_time': '3-6 weeks',  'notes': 'Gold partner status'},
    {'id': 3,  'company': 'SoftwareOne',           'contact': 'Emma Brown',     'email': 'ebrown@swone.com',     'phone': '+41-44-832-4100', 'country': 'Switzerland','type': 'Partner',  'capabilities': 'Software licensing, Cloud migration',    'lead_time': '1 week',     'notes': 'Microsoft licensing specialist'},
    {'id': 4,  'company': 'Arrow Electronics',     'contact': 'James Wilson',   'email': 'jwilson@arrow.com',    'phone': '+1-303-824-4000', 'country': 'USA',        'type': 'Supplier', 'capabilities': 'Electronic components, Distribution',    'lead_time': '1-2 weeks',  'notes': 'Large volume discounts available'},
    {'id': 5,  'company': 'Ingram Micro',          'contact': 'Linda Zhang',    'email': 'lzhang@ingrammicro.com','phone':'+1-714-566-1000', 'country': 'USA',        'type': 'Supplier', 'capabilities': 'IT products, Cloud, Mobility',           'lead_time': '3-5 days',   'notes': 'Fast delivery on stock items'},
    {'id': 6,  'company': 'Computacenter',         'contact': 'Oliver Nash',    'email': 'onash@computacenter.com','phone':'+44-1442-232-121','country': 'UK',        'type': 'Partner',  'capabilities': 'Infrastructure, Managed services, ITSM', 'lead_time': '2 weeks',    'notes': 'European operations lead'},
    {'id': 7,  'company': 'HPE',                   'contact': 'Natalie Ford',   'email': 'nford@hpe.com',        'phone': '+1-650-857-1501', 'country': 'USA',        'type': 'OEM',      'capabilities': 'Servers, HPC, Hybrid Cloud',             'lead_time': '4-8 weeks',  'notes': 'HPE GreenLake specialist'},
    {'id': 8,  'company': 'Dimension Data',        'contact': 'Carlos Vega',    'email': 'cvega@dimensiondata.com','phone':'+27-11-575-0000','country': 'South Africa','type': 'Partner', 'capabilities': 'Network, Security, Cloud Africa',        'lead_time': '2-3 weeks',  'notes': 'Africa & MEA regional partner'},
    {'id': 9,  'company': 'TD SYNNEX',             'contact': 'Michelle Tran',  'email': 'mtran@tdsynnex.com',   'phone': '+1-408-588-8000', 'country': 'USA',        'type': 'Supplier', 'capabilities': 'Full IT distribution, Cloud services',   'lead_time': '2-4 days',   'notes': 'Broadest product catalogue'},
]

TASKS = [
    {'id': 1,  'title': 'Set up CI/CD pipeline',         'description': 'Configure GitHub Actions for automated deployments',      'assignee': 'Jordan Lee',  'priority': 'High',   'due': '2025-05-10', 'project': 'DevOps Pipeline Setup',     'column': 'In Progress'},
    {'id': 2,  'title': 'Write project kickoff report',  'description': 'Document scope, risks, and timeline for Q3 projects',    'assignee': 'Morgan Chen', 'priority': 'Medium', 'due': '2025-05-15', 'project': 'ERP Implementation',         'column': 'To Do'},
    {'id': 3,  'title': 'Review firewall rules',         'description': 'Audit all inbound/outbound firewall policies',            'assignee': 'Alex Kim',    'priority': 'Urgent', 'due': '2025-04-28', 'project': 'Cybersecurity Audit',        'column': 'To Do'},
    {'id': 4,  'title': 'Migrate legacy database',       'description': 'Move on-prem Oracle DB to AWS RDS',                       'assignee': 'Riley Scott', 'priority': 'High',   'due': '2025-05-20', 'project': 'Cloud Migration Phase 1',   'column': 'In Progress'},
    {'id': 5,  'title': 'Stakeholder presentation',      'description': 'Prepare slides for Q2 progress review',                  'assignee': 'Morgan Chen', 'priority': 'Medium', 'due': '2025-05-05', 'project': 'ERP Implementation',         'column': 'Done'},
    {'id': 6,  'title': 'Server rack installation',      'description': 'Install and cable 4x Dell R750 servers in DC',           'assignee': 'Jordan Lee',  'priority': 'High',   'due': '2025-05-12', 'project': 'Network Infrastructure Upgrade','column': 'Done'},
    {'id': 7,  'title': 'Update DR runbook',             'description': 'Revise disaster recovery steps for new cloud environment','assignee': 'Alex Kim',    'priority': 'Low',    'due': '2025-06-01', 'project': 'Disaster Recovery Planning', 'column': 'To Do'},
    {'id': 8,  'title': 'Security awareness training',   'description': 'Schedule and run phishing simulation for 200 staff',     'assignee': 'Riley Scott', 'priority': 'Medium', 'due': '2025-05-25', 'project': 'Cybersecurity Audit',        'column': 'To Do'},
    {'id': 9,  'title': 'Load test application',         'description': 'Run JMeter load tests on staging environment',           'assignee': 'Jordan Lee',  'priority': 'High',   'due': '2025-04-30', 'project': 'DevOps Pipeline Setup',     'column': 'In Progress'},
    {'id': 10, 'title': 'Vendor contract renewal',       'description': 'Review and sign Cisco maintenance renewal',              'assignee': 'Morgan Chen', 'priority': 'Urgent', 'due': '2025-04-25', 'project': 'Network Infrastructure Upgrade','column': 'Done'},
    {'id': 11, 'title': 'Data schema design',            'description': 'Design star schema for warehouse tables',                'assignee': 'Riley Scott', 'priority': 'Medium', 'due': '2025-05-30', 'project': 'Data Warehouse Build',       'column': 'In Progress'},
    {'id': 12, 'title': 'Backup policy documentation',   'description': 'Document backup schedules and retention policies',      'assignee': 'Alex Kim',    'priority': 'Low',    'due': '2025-06-10', 'project': 'Disaster Recovery Planning', 'column': 'To Do'},
]

_project_id_counter = 10
_partner_id_counter = 10
_task_id_counter    = 13

# ─── Auth helpers ─────────────────────────────────────────────────────────────

def login_required(f):
    @wraps(f)
    def decorated(*args, **kwargs):
        if 'username' not in session:
            return redirect(url_for('login'))
        return f(*args, **kwargs)
    return decorated

def get_current_user():
    return USERS.get(session.get('username'))

# ─── Auth routes ──────────────────────────────────────────────────────────────

@app.route('/')
def index():
    return redirect(url_for('dashboard') if 'username' in session else url_for('login'))

@app.route('/login', methods=['GET', 'POST'])
def login():
    if request.method == 'POST':
        data = request.get_json()
        username = data.get('username', '').strip()
        password = data.get('password', '').strip()
        user = USERS.get(username)
        if user and user['password'] == password:
            session['username'] = username
            return jsonify({'success': True})
        return jsonify({'success': False, 'message': 'Invalid credentials. Please try again.'})
    return render_template('login.html')

@app.route('/logout')
def logout():
    session.clear()
    return redirect(url_for('login'))

# ─── Page routes ──────────────────────────────────────────────────────────────

@app.route('/dashboard')
@login_required
def dashboard():
    return render_template('dashboard.html', user=get_current_user())

@app.route('/projects')
@login_required
def projects():
    return render_template('projects.html', user=get_current_user())

@app.route('/partners')
@login_required
def partners():
    return render_template('partners.html', user=get_current_user())

@app.route('/tasks')
@login_required
def tasks():
    return render_template('tasks.html', user=get_current_user())

# ─── API: Projects ────────────────────────────────────────────────────────────

@app.route('/api/projects', methods=['GET'])
@login_required
def api_get_projects():
    return jsonify(PROJECTS)

@app.route('/api/projects', methods=['POST'])
@login_required
def api_add_project():
    global _project_id_counter
    data = request.get_json()
    project = {
        'id':       _project_id_counter,
        'name':     data['name'],
        'client':   data['client'],
        'status':   data['status'],
        'start':    data['start'],
        'deadline': data['deadline'],
        'budget':   float(data['budget']),
        'lead':     data['lead'],
        'progress': int(data['progress']),
    }
    PROJECTS.append(project)
    _project_id_counter += 1
    return jsonify(project), 201

@app.route('/api/projects/<int:pid>', methods=['PUT'])
@login_required
def api_update_project(pid):
    data = request.get_json()
    for p in PROJECTS:
        if p['id'] == pid:
            p.update({
                'name':     data['name'],
                'client':   data['client'],
                'status':   data['status'],
                'start':    data['start'],
                'deadline': data['deadline'],
                'budget':   float(data['budget']),
                'lead':     data['lead'],
                'progress': int(data['progress']),
            })
            return jsonify(p)
    return jsonify({'error': 'Not found'}), 404

@app.route('/api/projects/<int:pid>', methods=['DELETE'])
@login_required
def api_delete_project(pid):
    global PROJECTS
    PROJECTS = [p for p in PROJECTS if p['id'] != pid]
    return jsonify({'success': True})

# ─── API: Partners ────────────────────────────────────────────────────────────

@app.route('/api/partners', methods=['GET'])
@login_required
def api_get_partners():
    return jsonify(PARTNERS)

@app.route('/api/partners', methods=['POST'])
@login_required
def api_add_partner():
    global _partner_id_counter
    data = request.get_json()
    partner = {
        'id':           _partner_id_counter,
        'company':      data['company'],
        'contact':      data['contact'],
        'email':        data['email'],
        'phone':        data['phone'],
        'country':      data['country'],
        'type':         data['type'],
        'capabilities': data['capabilities'],
        'lead_time':    data['lead_time'],
        'notes':        data.get('notes', ''),
    }
    PARTNERS.append(partner)
    _partner_id_counter += 1
    return jsonify(partner), 201

@app.route('/api/partners/<int:pid>', methods=['PUT'])
@login_required
def api_update_partner(pid):
    data = request.get_json()
    for p in PARTNERS:
        if p['id'] == pid:
            p.update({
                'company':      data['company'],
                'contact':      data['contact'],
                'email':        data['email'],
                'phone':        data['phone'],
                'country':      data['country'],
                'type':         data['type'],
                'capabilities': data['capabilities'],
                'lead_time':    data['lead_time'],
                'notes':        data.get('notes', ''),
            })
            return jsonify(p)
    return jsonify({'error': 'Not found'}), 404

@app.route('/api/partners/<int:pid>', methods=['DELETE'])
@login_required
def api_delete_partner(pid):
    global PARTNERS
    PARTNERS = [p for p in PARTNERS if p['id'] != pid]
    return jsonify({'success': True})

# ─── API: Tasks ───────────────────────────────────────────────────────────────

@app.route('/api/tasks', methods=['GET'])
@login_required
def api_get_tasks():
    return jsonify(TASKS)

@app.route('/api/tasks', methods=['POST'])
@login_required
def api_add_task():
    global _task_id_counter
    data = request.get_json()
    task = {
        'id':          _task_id_counter,
        'title':       data['title'],
        'description': data.get('description', ''),
        'assignee':    data['assignee'],
        'priority':    data['priority'],
        'due':         data['due'],
        'project':     data.get('project', ''),
        'column':      data.get('column', 'To Do'),
    }
    TASKS.append(task)
    _task_id_counter += 1
    return jsonify(task), 201

@app.route('/api/tasks/<int:tid>', methods=['PUT'])
@login_required
def api_update_task(tid):
    data = request.get_json()
    for t in TASKS:
        if t['id'] == tid:
            t.update({
                'title':       data['title'],
                'description': data.get('description', ''),
                'assignee':    data['assignee'],
                'priority':    data['priority'],
                'due':         data['due'],
                'project':     data.get('project', ''),
                'column':      data.get('column', t['column']),
            })
            return jsonify(t)
    return jsonify({'error': 'Not found'}), 404

@app.route('/api/tasks/<int:tid>', methods=['DELETE'])
@login_required
def api_delete_task(tid):
    global TASKS
    TASKS = [t for t in TASKS if t['id'] != tid]
    return jsonify({'success': True})

@app.route('/api/projects/names', methods=['GET'])
@login_required
def api_project_names():
    return jsonify([p['name'] for p in PROJECTS])

# ─── Dashboard stats ──────────────────────────────────────────────────────────

@app.route('/api/stats', methods=['GET'])
@login_required
def api_stats():
    today = datetime.date.today().isoformat()
    total_proj   = len(PROJECTS)
    in_progress  = sum(1 for p in PROJECTS if p['status'] == 'In Progress')
    overdue      = sum(1 for p in PROJECTS if p['deadline'] < today and p['status'] not in ('Completed','Cancelled'))
    total_part   = len(PARTNERS)
    partners_cnt = sum(1 for p in PARTNERS if p['type'] == 'Partner')
    suppliers_cnt= sum(1 for p in PARTNERS if p['type'] == 'Supplier')
    oems_cnt     = sum(1 for p in PARTNERS if p['type'] == 'OEM')
    total_tasks  = len(TASKS)
    tasks_overdue= sum(1 for t in TASKS if t['due'] < today and t['column'] != 'Done')
    from datetime import date, timedelta
    week_start = (date.today() - timedelta(days=date.today().weekday())).isoformat()
    tasks_done_week = sum(1 for t in TASKS if t['column'] == 'Done')
    return jsonify({
        'projects': {'total': total_proj, 'in_progress': in_progress, 'overdue': overdue},
        'partners': {'total': total_part, 'partners': partners_cnt, 'suppliers': suppliers_cnt, 'oems': oems_cnt},
        'tasks':    {'total': total_tasks, 'overdue': tasks_overdue, 'done_week': tasks_done_week},
    })

if __name__ == '__main__':
    app.run(host='0.0.0.0', port=5000, debug=False)