document.addEventListener('DOMContentLoaded', function() {
    // --- Global State & Data ---
    let currentView = 'journey-overview'; // journey-overview, journey-detail, people, contracts, filebox, settings
    let activeJourneyId = null;
    let isNewJourney = false;
    let currentUser = { name: "Demo User", id: "user0" }; // Simulate logged-in user
    let activeFilterLabels = []; // Stores currently active filter labels

    // Default phases
    const defaultPhases = ["Scope", "Sent", "Response", "Review", "Job Walk", "Awarded", "Construction", "Closeout"];
    const defaultStatuses = ["Preparing", "Reviewing", "Waiting", "Complete"];

    // In-memory data stores (Full Sample Data)
    let db = {
        journeys: {
            "j1": {
                id: "j1",
                name: "Downtown Office Fit-out",
                contractors: ["ConstructCo", "DesignBuild Inc."],
                location: ["123 Main St, Anytown USA"],
                tenants: ["TechCorp"],
                phaseIndex: 2, // Response
                assignedTo: "p2", // ID of participant who needs to act next
                nextDeadline: "2024-08-15",
                status: "Response",
                lastUpdate: "2024-07-28T10:30:00Z",
                updatedBy: "Alice Martin",
                description: "Complete fit-out for floors 10 and 11.",
                customStatus: null,
                phases: [...defaultPhases],
                participants: [
                    { id: "p1", name: "Alice Martin", role: "Owner", labels: ["Lead"] },
                    { id: "p2", name: "ConstructCo Rep", role: "Contractor", labels: ["GC", "Primary"] },
                    { id: "p3", name: "DesignBuild Arch.", role: "Contractor", labels: ["Architect"] },
                    { id: "p4", name: "TechCorp Fac.", role: "Tenant", labels: [] },
                    { id: "p5", name: "Bob Jones", role: "Owner", labels: ["Finance"] },
                ],
                documents: [
                    {
                        id: "d1",
                        name: "RFP Package v1.pdf",
                        description: "", // New description field
                        added: "2024-07-20T09:00:00Z",
                        addedBy: "Alice Martin",
                        labels: ["RFP", "Critical"],
                        comments: [{by: "Alice Martin", time: "2024-07-20T09:05:00Z", text: "Initial RFP"}]
                    },
                    {
                        id: "d2",
                        name: "Floor Plan Rev B.dwg",
                        description: "",
                        added: "2024-07-22T14:00:00Z",
                        addedBy: "DesignBuild Arch.",
                        labels: ["Design", "CAD"],
                        comments: []
                    },
                ],
                tasks: [
                    {
                        id: "t1",
                        type: "task",
                        description: "Submit Initial Proposal",
                        assignee: "p2",
                        interested: ["p3"],
                        dueDate: "2024-08-15",
                        completed: false,
                        labels: ["Proposal", "Urgent"],
                        comments: []
                    },
                    {
                        id: "t2",
                        type: "checklist",
                        title: "Site Walk Checklist",
                        assignee: "p1",
                        interested: [],
                        dueDate: null,
                        completed: false,
                        labels: ["Site", "Critical"],
                        items: [
                            { text: "Verify access", completed: true },
                            { text: "Check power availability", completed: false }
                        ],
                        comments: [
                            {by: "Alice Martin", time: "2024-07-29T11:00:00Z", text: "Access verified."}
                        ]
                    }
                ],
                activityLog: [
                    { time: "2024-07-29T11:00:00Z", user: "Alice Martin", action: "Added comment to task 'Site Walk Checklist'", phase: "Response" },
                    { time: "2024-07-28T10:30:00Z", user: "Alice Martin", action: "Updated deadline for task 'Submit Initial Proposal'", phase: "Response" },
                    { time: "2024-07-22T14:00:00Z", user: "DesignBuild Arch.", action: "Uploaded document 'Floor Plan Rev B.dwg'", phase: "Response" },
                    { time: "2024-07-20T09:00:00Z", user: "Alice Martin", action: "Created Journey 'Downtown Office Fit-out'", phase: "Scope" },
                ],
                commentHistory: [
                    {
                        time: "2024-07-29T11:00:00Z",
                        user: "Alice Martin",
                        text: "Access verified.",
                        phase: "Response",
                        context: { type: 'task', id: 't2'}
                    },
                    {
                        time: "2024-07-28T10:35:00Z",
                        user: "Alice Martin",
                        text: "@ConstructCo Rep Please ensure the proposal includes alternate material options.",
                        phase: "Response",
                        context: { type: 'task', id: 't1'}
                    },
                    {
                        time: "2024-07-22T14:05:00Z",
                        user: "DesignBuild Arch.",
                        text: "Updated floor plan attached.",
                        phase: "Response",
                        context: { type: 'document', id: 'd2'}
                    },
                    {
                        time: "2024-07-20T09:05:00Z",
                        user: "Alice Martin",
                        text: "Initial RFP",
                        phase: "Scope",
                        context: { type: 'document', id: 'd1'}
                    },
                ]
            },
            "j2": {
                id: "j2",
                name: "Campus HVAC Upgrade",
                contractors: ["MechPro Inc."],
                location: ["Main Campus", "West Wing"],
                tenants: [],
                phaseIndex: 5, // Awarded
                assignedTo: "p1", // ID of participant who needs to act next
                nextDeadline: "2024-09-01",
                status: "Awarded",
                lastUpdate: "2024-07-25T16:00:00Z",
                updatedBy: "Bob Jones",
                description: "Full HVAC replacement for the west wing.",
                customStatus: null,
                phases: ["Scope", "Bid", "Review", "Interviews", "Negotiation", "Awarded", "Installation", "Commissioning", "Closeout"],
                participants: [
                    { id: "p1", name: "Alice Martin", role: "Owner", labels: ["Lead"] },
                    { id: "p5", name: "Bob Jones", role: "Owner", labels: ["Finance", "Approval"] },
                    { id: "p7", name: "MechPro Inc.", role: "Contractor", labels: ["HVAC", "Awarded"] }
                ],
                documents: [
                    {
                        id: "d3",
                        name: "MechPro Final Proposal.pdf",
                        description: "",
                        added: "2024-07-15T11:00:00Z",
                        addedBy: "MechPro Inc.",
                        labels: ["Proposal", "Awarded"],
                        comments: []
                    },
                    {
                        id: "d4",
                        name: "Signed Contract - HVAC.pdf",
                        description: "",
                        added: "2024-07-25T15:55:00Z",
                        addedBy: "Bob Jones",
                        labels: ["Contract", "Legal", "Executed"],
                        comments: [
                            {by:"Bob Jones", time:"2024-07-25T15:56:00Z", text:"Contract executed."}
                        ]
                    },
                ],
                tasks: [
                    {
                        id: "t3",
                        type: "task",
                        description: "Issue Notice to Proceed",
                        assignee: "p1",
                        interested: ["p5","p7"],
                        dueDate: "2024-08-01",
                        completed: false,
                        labels: ["Contract", "Admin"],
                        comments: [
                            {by:"Bob Jones", time:"2024-07-25T16:01:00Z", text:"@Alice Martin Please issue the NTP."}
                        ]
                    },
                    {
                        id: "t4",
                        type: "task",
                        description: "Submit Insurance Certificates",
                        assignee: "p7",
                        interested: ["p1"],
                        dueDate: "2024-08-10",
                        completed: false,
                        labels: ["Compliance", "Insurance"],
                        comments: []
                    }
                ],
                activityLog: [
                    { time: "2024-07-25T16:01:00Z", user: "Bob Jones", action: "Added comment to task 'Issue Notice to Proceed'", phase: "Awarded" },
                    { time: "2024-07-25T16:00:00Z", user: "Bob Jones", action: "Marked Journey as Awarded", phase: "Awarded" },
                    { time: "2024-07-25T15:56:00Z", user: "Bob Jones", action: "Added comment to document 'Signed Contract - HVAC.pdf'", phase: "Awarded" },
                    { time: "2024-07-25T15:55:00Z", user: "Bob Jones", action: "Uploaded document 'Signed Contract - HVAC.pdf'", phase: "Awarded" },
                    { time: "2024-07-15T11:00:00Z", user: "MechPro Inc.", action: "Uploaded document 'MechPro Final Proposal.pdf'", phase: "Negotiation" },
                ],
                commentHistory: [
                    {
                        time: "2024-07-25T16:01:00Z",
                        user: "Bob Jones",
                        text: "@Alice Martin Please issue the NTP.",
                        phase: "Awarded",
                        context: { type: 'task', id: 't3'}
                    },
                    {
                        time: "2024-07-25T15:56:00Z",
                        user: "Bob Jones",
                        text: "Contract executed.",
                        phase: "Awarded",
                        context: { type: 'document', id: 'd4'}
                    },
                ]
            }
        },
        people: {
            "p1": { id: "p1", name: "Alice Martin", title: "Project Manager", company: "eConverge", image: "", labels: ["Lead", "Internal"] },
            "p2": { id: "p2", name: "ConstructCo Rep", title: "Lead Estimator", company: "ConstructCo LLC", image: "", labels: ["GC", "External", "Primary"] },
            "p3": { id: "p3", name: "DesignBuild Arch.", title: "Senior Architect", company: "DesignBuild Inc.", image: "", labels: ["Architect", "External"] },
            "p4": { id: "p4", name: "TechCorp Fac.", title: "Facilities Lead", company: "TechCorp", image: "", labels: ["Tenant", "Key Contact"] },
            "p5": { id: "p5", name: "Bob Jones", title: "Procurement Officer", company: "eConverge", image: "", labels: ["Finance", "Internal"] },
            "p6": { id: "p6", name: "Supplier X", title: "Sales Rep", company: "Materials Inc.", image: "", labels: ["Supplier", "External"] },
            "p7": { id: "p7", name: "MechPro Inc.", title: "Project Manager", company: "MechPro Inc.", image: "", labels: ["HVAC", "External", "Contractor"] }
        },
        contracts: {
            "c1": { id: "c1", contractWith: "ConstructCo LLC", summary: "Master Services Agreement", startDate: "2023-01-01", endDate: "2025-12-31", files: ["MSA_ConstructCo.pdf"] },
            "c2": { id: "c2", contractWith: "DesignBuild Inc.", summary: "Standard Design Contract", startDate: "2022-06-01", endDate: "", files: ["DesignBuild_Contract.pdf", "Amendment1.pdf"] },
            "c3": { id: "c3", contractWith: "MechPro Inc.", summary: "HVAC Upgrade Contract", startDate: "2024-07-25", endDate: "2025-01-31", files: ["Signed Contract - HVAC.pdf"] }
        }
    };

    // User Settings Store
    if (!db.settings) {
        db.settings = {
            defaultMilestones: [...defaultPhases],
            defaultRoles: ['Contractor', 'Owner', 'Reviewer', 'Tenant', 'Stakeholder', 'Other'],
            // Enhanced: now an array of objects for name/type/content
            templates: []
        };
    }

    // NEW: File Box storage
    if (!db.fileBox) {
        db.fileBox = [];
    }

    // --- DOM Element References ---
    const headerTitle = document.getElementById('header-title');
    const headerActionButton = document.getElementById('header-action-button');

    const views = {
        'journey-overview': document.getElementById('journey-overview-view'),
        'journey-detail': document.getElementById('journey-detail-view'),
        'people': document.getElementById('people-view'),
        'contracts': document.getElementById('contracts-view'),
        'filebox': document.getElementById('filebox-view'),
        'settings': document.getElementById('settings-view')
    };

    const navItems = {
        'journeys': document.getElementById('nav-journeys'),
        'people': document.getElementById('nav-people'),
        'contracts': document.getElementById('nav-contracts'),
        'filebox': document.getElementById('nav-filebox'),
        'settings': document.getElementById('nav-settings')
    };

    // Journey detail references
    const journeyListTbody = document.getElementById('journey-list-tbody');
    const journeyDetailTitle = document.getElementById('journey-detail-title');
    const journeyStateText = document.getElementById('journey-state-text');
    const journeySaveButton = document.getElementById('journey-save-button');
    const journeyStatusSelect = document.getElementById('journey-status-select');
    const journeyStatusCustom = document.getElementById('journey-status-custom');
    const journeyStatusEditToggle = document.getElementById('journey-status-edit-toggle');
    const journeyDetailsButton = document.getElementById('journey-details-button');
    const journeyPhasesDisplay = document.getElementById('journey-phases-display');
    const editPhasesBtn = document.getElementById('edit-phases-btn');
    const advancePhaseBtn = document.getElementById('advance-phase-btn');
    const addParticipantBtn = document.getElementById('add-participant-btn');
    const participantsList = document.getElementById('participants-list');
    const documentsList = document.getElementById('documents-list');
    const addDocumentBtn = document.getElementById('add-document-btn');
    const tasksList = document.getElementById('tasks-list');
    const addTaskBtn = document.getElementById('add-task-btn');
    const commentHistoryList = document.getElementById('comment-history-list');
    const activityLogList = document.getElementById('activity-log-list');

    // People
    const peopleListTbody = document.getElementById('people-list-tbody');
    // Contracts
    const contractsListTbody = document.getElementById('contracts-list-tbody');

    // File Box
    const fileboxList = document.getElementById('filebox-list');
    const addFileboxButton = document.getElementById('add-filebox-button');

    // Settings
    const milestonesEl = document.getElementById('default-milestones');
    const rolesEl = document.getElementById('default-roles');
    const templateEntriesContainer = document.getElementById('template-entries');
    const addTemplateBtn = document.getElementById('add-template-btn');

    // Modals
    const journeyDetailsModal = document.getElementById('journey-details-modal');
    const editPhasesModal = document.getElementById('edit-phases-modal');
    const participantModal = document.getElementById('participant-modal');
    const documentModal = document.getElementById('document-modal');
    const taskModal = document.getElementById('task-modal');
    const personModal = document.getElementById('person-modal');
    const contractModal = document.getElementById('contract-modal');
    const fileboxModal = document.getElementById('filebox-modal');

    // Utility Functions
    const showView = (viewId) => {
        // Hide all
        Object.values(views).forEach(v => v.classList.add('hidden'));
        if (views[viewId]) {
            views[viewId].classList.remove('hidden');
            currentView = viewId;
            updateHeader();
            updateNav();
        } else {
            console.error("View not found:", viewId);
            views['journey-overview'].classList.remove('hidden'); 
            currentView = 'journey-overview';
            updateHeader();
            updateNav();
        }
    };

    const updateHeader = () => {
        switch (currentView) {
            case 'journey-overview':
                headerTitle.textContent = 'Journey Overview';
                headerActionButton.innerHTML = '<i class="fa-solid fa-plus"></i> New Journey';
                headerActionButton.onclick = handleNewJourneyClick;
                headerActionButton.classList.remove('hidden');
                break;
            case 'journey-detail':
                if (activeJourneyId) {
                    const journey = db.journeys[activeJourneyId];
                    headerTitle.textContent = `Journey: ${journey?.name || 'Journey Detail'}`;
                } else {
                    headerTitle.textContent = 'Journey Detail';
                }
                headerActionButton.classList.add('hidden');
                break;
            case 'people':
                headerTitle.textContent = 'People Directory';
                headerActionButton.innerHTML = '<i class="fa-solid fa-plus"></i> Add Person';
                headerActionButton.onclick = handleAddPersonClick;
                headerActionButton.classList.remove('hidden');
                break;
            case 'contracts':
                headerTitle.textContent = 'Contracts Repository';
                headerActionButton.innerHTML = '<i class="fa-solid fa-plus"></i> Add Contract';
                headerActionButton.onclick = handleAddContractClick;
                headerActionButton.classList.remove('hidden');
                break;
            case 'filebox':
                headerTitle.textContent = 'File Box';
                headerActionButton.innerHTML = '<i class="fa-solid fa-plus"></i> Add File';
                headerActionButton.onclick = handleAddFileBoxClick;
                headerActionButton.classList.remove('hidden');
                break;
            case 'settings':
                headerTitle.textContent = 'Settings';
                headerActionButton.classList.add('hidden');
                break;
            default:
                headerTitle.textContent = 'eConverge Procurement';
                headerActionButton.classList.add('hidden');
        }
    };

    const updateNav = () => {
        Object.values(navItems).forEach(item => item.classList.remove('active'));
        // We have nav items: journeys -> journey-overview or journey-detail
        // So if currentView starts with 'journey', highlight 'journeys'
        if (currentView.startsWith('journey')) {
            navItems['journeys'].classList.add('active');
        } else if (navItems[currentView]) {
            navItems[currentView].classList.add('active');
        }
    };

    const showModal = (modalElement) => {
        if (modalElement) modalElement.style.display = 'flex';
    };

    const hideModal = (modalElement) => {
        if (modalElement) modalElement.style.display = 'none';
    };

    const formatDate = (dateString) => {
        if (!dateString) return 'N/A';
        try {
            const date = new Date(dateString + 'T00:00:00');
            return date.toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });
        } catch {
            return dateString;
        }
    };

    const formatDateTime = (dateString) => {
        if (!dateString) return 'N/A';
        try {
            const date = new Date(dateString);
            return date.toLocaleString('en-US', {
                year: 'numeric',
                month: 'short',
                day: 'numeric',
                hour: 'numeric',
                minute: '2-digit'
            });
        } catch {
            return dateString;
        }
    };

    const timeAgo = (dateString) => {
        if (!dateString) return '';
        try {
            const date = new Date(dateString);
            const now = new Date();
            const seconds = Math.floor((now - date) / 1000);
            if (seconds < 5) return 'just now';
            let interval = Math.floor(seconds / 31536000);
            if (interval >= 1) return `${interval} year${interval > 1 ? 's' : ''} ago`;
            interval = Math.floor(seconds / 2592000);
            if (interval >= 1) return `${interval} month${interval > 1 ? 's' : ''} ago`;
            interval = Math.floor(seconds / 86400);
            if (interval >= 1) return `${interval} day${interval > 1 ? 's' : ''} ago`;
            interval = Math.floor(seconds / 3600);
            if (interval >= 1) return `${interval} hour${interval > 1 ? 's' : ''} ago`;
            interval = Math.floor(seconds / 60);
            if (interval >= 1) return `${interval} minute${interval > 1 ? 's' : ''} ago`;
            return `${Math.floor(seconds)} second${seconds > 1 ? 's' : ''} ago`;
        } catch {
            return '';
        }
    };

    const generateId = (prefix = '') => prefix + Date.now().toString(36) + Math.random().toString(36).substring(2, 5);

    const getParticipantName = (participantId, journeyId = activeJourneyId) => {
        if (!journeyId || !db.journeys[journeyId]) return participantId || 'Unknown';
        const participant = (db.journeys[journeyId].participants || []).find(p => p.id === participantId);
        return participant?.name || participantId || 'Unknown';
    };

    const logActivity = (journeyId, action) => {
        if (!journeyId || !db.journeys[journeyId]) return;
        const journey = db.journeys[journeyId];
        if (!journey.activityLog) journey.activityLog = [];
        journey.activityLog.unshift({
            time: new Date().toISOString(),
            user: currentUser.name,
            action: action,
            phase: (journey.phases || defaultPhases)[journey.phaseIndex] || 'N/A'
        });
        journey.lastUpdate = new Date().toISOString();
        journey.updatedBy = currentUser.name;
        if (activeJourneyId === journeyId && currentView === 'journey-detail') {
            renderActivityLog(journey.activityLog);
        }
        if (currentView === 'journey-overview') {
            renderJourneyOverview();
        }
    };

    const addComment = (journeyId, context, text) => {
        if (!journeyId || !db.journeys[journeyId] || !text.trim()) {
            return false;
        }
        const journey = db.journeys[journeyId];
        if (!journey.commentHistory) journey.commentHistory = [];

        const newComment = {
            time: new Date().toISOString(),
            user: currentUser.name,
            text: text.trim(),
            phase: (journey.phases || defaultPhases)[journey.phaseIndex] || 'N/A',
            context: context
        };

        journey.commentHistory.unshift(newComment);

        let itemUpdated = false;
        try {
            if (context.type === 'document' && context.id) {
                const doc = (journey.documents || []).find(d => d.id === context.id);
                if (doc) {
                    if (!doc.comments) doc.comments = [];
                    doc.comments.push({ by: currentUser.name, time: newComment.time, text: newComment.text });
                    itemUpdated = true;
                }
            } else if (context.type === 'task' && context.id) {
                const task = (journey.tasks || []).find(t => t.id === context.id);
                if (task) {
                    if (!task.comments) task.comments = [];
                    task.comments.push({ by: currentUser.name, time: newComment.time, text: newComment.text });
                    itemUpdated = true;
                }
            }
        } catch (error) {
            console.error("Error updating item's comment list:", error);
        }

        logActivity(journeyId, `Added comment: "${text.substring(0, 50)}..."`);

        if (activeJourneyId === journeyId && currentView === 'journey-detail') {
            renderCommentHistory(db.journeys[journeyId].commentHistory);
        }
        return itemUpdated;
    };

    const parseLabels = (labelString) => {
        if (!labelString) return [];
        return labelString.split(',')
            .map(l => l.trim())
            .filter(l => l)
            .filter((value, index, self) => self.indexOf(value) === index);
    };

    const formatLabels = (labelsArray) => {
        if (!labelsArray || labelsArray.length === 0) return '';
        return labelsArray.map(l => `<span class="label-badge">${l}</span>`).join(' ');
    };

    // --- RENDERING FUNCTIONS ---

    // Journey Overview
    function renderJourneyOverview() {
        journeyListTbody.innerHTML = '';
        const journeys = Object.values(db.journeys);
        if (journeys.length === 0) {
            journeyListTbody.innerHTML = `<tr><td colspan="10" class="text-placeholder">No journeys found. Click 'New Journey' to create one.</td></tr>`;
            return;
        }
        journeys.sort((a, b) => new Date(b.lastUpdate || 0) - new Date(a.lastUpdate || 0));

        journeys.forEach(j => {
            const tr = document.createElement('tr');
            tr.dataset.journeyId = j.id;
            tr.classList.add('cursor-pointer');
            const phaseName = (j.phases || defaultPhases)[j.phaseIndex] || 'N/A';
            const status = j.customStatus || j.status || phaseName;
            const statusClass = status.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '');

            const contractors = (j.participants || []).filter(p => p.role === 'Contractor').map(p => p.name).join(', ') || 'N/A';
            const tenants = (j.participants || []).filter(p => p.role === 'Tenant').map(p => p.name).join(', ') || 'N/A';

            tr.innerHTML = `
                <td>${j.name || 'Unnamed Journey'}</td>
                <td>${contractors}</td>
                <td>${(j.location || []).join(', ') || 'N/A'}</td>
                <td>${tenants}</td>
                <td>${phaseName}</td>
                <td>${getParticipantName(j.assignedTo, j.id)}</td>
                <td>${formatDate(j.nextDeadline)}</td>
                <td><span class="status-badge status-${statusClass}">${status}</span></td>
                <td>${timeAgo(j.lastUpdate)}</td>
                <td>${j.updatedBy || 'N/A'}</td>
            `;
            tr.addEventListener('click', () => loadJourneyDetail(j.id));
            journeyListTbody.appendChild(tr);
        });
    }

    // Label Filter
    function getAvailableLabelsForJourney(journeyId) {
        const journey = db.journeys[journeyId];
        if (!journey) return [];
        const allLabels = new Set();
        (journey.participants || []).forEach(p => (p.labels || []).forEach(l => allLabels.add(l)));
        (journey.documents || []).forEach(d => (d.labels || []).forEach(l => allLabels.add(l)));
        (journey.tasks || []).forEach(t => (t.labels || []).forEach(l => allLabels.add(l)));
        return Array.from(allLabels).sort();
    }

    function renderAvailableLabels(availableLabels) {
        const container = document.getElementById('available-labels-container');
        const clearButton = document.getElementById('clear-label-filters-btn');
        container.innerHTML = '';
        if (!availableLabels || availableLabels.length === 0) {
            container.innerHTML = '<span class="text-muted" style="font-size: 12px;">No labels found in this journey.</span>';
            clearButton.style.display = 'none';
            return;
        }
        availableLabels.forEach(label => {
            const badge = document.createElement('span');
            badge.className = 'label-badge';
            badge.textContent = label;
            badge.dataset.label = label;
            if (activeFilterLabels.includes(label)) {
                badge.classList.add('active-filter');
            }
            badge.addEventListener('click', handleLabelFilterClick);
            container.appendChild(badge);
        });
        clearButton.style.display = activeFilterLabels.length > 0 ? 'inline-block' : 'none';
    }

    function handleLabelFilterClick(e) {
        const clickedLabel = e.target.dataset.label;
        if (!clickedLabel) return;
        const index = activeFilterLabels.indexOf(clickedLabel);
        if (index > -1) {
            activeFilterLabels.splice(index, 1);
            e.target.classList.remove('active-filter');
        } else {
            activeFilterLabels.push(clickedLabel);
            e.target.classList.add('active-filter');
        }
        document.getElementById('clear-label-filters-btn').style.display = activeFilterLabels.length > 0 ? 'inline-block' : 'none';
        applyFiltersAndRerender();
    }

    function handleClearLabelFilters() {
        activeFilterLabels = [];
        document.querySelectorAll('#available-labels-container .label-badge').forEach(b => b.classList.remove('active-filter'));
        document.getElementById('clear-label-filters-btn').style.display = 'none';
        applyFiltersAndRerender();
    }

    function applyFiltersAndRerender() {
        if (currentView !== 'journey-detail' || !activeJourneyId || !db.journeys[activeJourneyId]) return;
        const journey = db.journeys[activeJourneyId];
        renderDocuments(journey.documents || []);
        renderTasks(journey.tasks || []);
        renderParticipants(journey.participants || []);
        renderNeedsAttention(journey);
    }

    // Journey Detail
    function loadJourneyDetail(journeyId) {
        const journey = db.journeys[journeyId];
        if (!journey) {
            alert("Error: Could not load journey.");
            showView('journey-overview');
            return;
        }
        activeJourneyId = journeyId;
        isNewJourney = false; // If it existed already, not new
        headerTitle.textContent = `Journey: ${journey.name}`;
        journeyDetailTitle.textContent = journey.name;
        if (!journey.lastUpdate) {
            journeyStateText.textContent = "Creating New Journey";
            journeySaveButton.innerHTML = '<i class="fa-solid fa-check"></i> Save and Create';
            journeyStateText.style.color = ""; // default
        } else {
            journeyStateText.textContent = "Adding to Journey";
            journeySaveButton.innerHTML = '<i class="fa-solid fa-lock"></i> Lock In Changes';
            // Make it red as requested
            journeyStateText.style.color = "red";
        }

        journeySaveButton.onclick = handleSaveChanges;
        activeFilterLabels = [];
        const availableLabels = getAvailableLabelsForJourney(journeyId);
        renderAvailableLabels(availableLabels);
        document.getElementById('clear-label-filters-btn').removeEventListener('click', handleClearLabelFilters);
        document.getElementById('clear-label-filters-btn').addEventListener('click', handleClearLabelFilters);

        renderJourneyStatus(journey);
        renderJourneyPhases(journey.phases || defaultPhases, journey.phaseIndex);
        advancePhaseBtn.disabled = journey.phaseIndex >= (journey.phases || defaultPhases).length - 1;
        showView('journey-detail');
        applyFiltersAndRerender();
        renderCommentHistory(journey.commentHistory || []);
        renderActivityLog(journey.activityLog || []);
        // Render bottom file box portion
        renderJourneyDetailFileBox();
    }

    function renderJourneyStatus(journey) {
        journeyStatusSelect.innerHTML = '';
        const currentStandardStatus = journey.status || (journey.phases ? journey.phases[journey.phaseIndex] : defaultPhases[journey.phaseIndex]);
        let allStatuses = [...defaultStatuses];
        if (currentStandardStatus && !allStatuses.includes(currentStandardStatus)) {
            allStatuses.push(currentStandardStatus);
        }
        if (journey.customStatus && !allStatuses.includes(journey.customStatus)) {
            allStatuses.push(journey.customStatus);
        }
        allStatuses = [...new Set(allStatuses)];
        allStatuses.forEach(s => {
            const option = document.createElement('option');
            option.value = s;
            option.textContent = s;
            journeyStatusSelect.appendChild(option);
        });
        const optionOther = document.createElement('option');
        optionOther.value = '__custom__';
        optionOther.textContent = 'Enter Custom Status...';
        journeyStatusSelect.appendChild(optionOther);

        const currentEffectiveStatus = journey.customStatus || currentStandardStatus;
        journeyStatusSelect.value = currentEffectiveStatus;
        journeyStatusCustom.classList.add('hidden');
        journeyStatusCustom.value = journey.customStatus || '';
    }

    function renderJourneyPhases(phases, activeIndex) {
        journeyPhasesDisplay.innerHTML = '';
        if (!phases || phases.length === 0) {
            journeyPhasesDisplay.innerHTML = '<p class="text-placeholder">No phases defined.</p>';
            return;
        }
        phases.forEach((phaseName, i) => {
            const phaseDiv = document.createElement('div');
            phaseDiv.className = 'phase';
            if (i < activeIndex) phaseDiv.classList.add('completed');
            if (i === activeIndex) phaseDiv.classList.add('active');
            phaseDiv.innerHTML = `
                <div class="phase-dot"></div>
                <div class="phase-label">${phaseName}</div>
            `;
            journeyPhasesDisplay.appendChild(phaseDiv);
        });
    }

    function renderParticipants(participants) {
        participantsList.innerHTML = '';
        const filterLabels = activeFilterLabels;
        const filtered = participants.filter(p => {
            if (filterLabels.length === 0) return true;
            const itemLabels = p.labels || [];
            return filterLabels.every(f => itemLabels.includes(f));
        });
        if (filtered.length === 0) {
            const message = filterLabels.length > 0 ? 'No participants match the current filter.' : 'No participants added yet.';
            participantsList.innerHTML = `<p class="text-placeholder">${message}</p>`;
            return;
        }
        filtered.forEach((p) => {
            const originalIndex = (participants || []).findIndex(orig => orig.id === p.id);
            const name = p.name;
            const role = p.role;
            let iconClass = 'fa-user';
            if (role === 'Owner') iconClass = 'fa-user-tie';
            else if (role === 'Contractor') iconClass = 'fa-user-hard-hat';
            else if (role === 'Tenant') iconClass = 'fa-building-user';

            const div = document.createElement('div');
            div.className = 'participant-item';
            div.innerHTML = `
                <div class="participant-icon"><i class="fa-solid ${iconClass}"></i></div>
                <div class="participant-name">${name}</div>
                <div class="participant-role">${role}</div>
                <div class="participant-labels-display">${formatLabels(p.labels || [])}</div>
                <button class="btn btn-sm btn-outline-primary mt-1 edit-participant-btn" data-original-index="${originalIndex}" title="Edit Participant"><i class="fa-solid fa-pencil"></i></button>
                <button class="btn btn-sm btn-outline-danger mt-1 remove-participant-btn" data-original-index="${originalIndex}" title="Remove Participant"><i class="fa-solid fa-trash"></i></button>
            `;
            participantsList.appendChild(div);
        });
        participantsList.querySelectorAll('.edit-participant-btn').forEach(btn => {
            btn.addEventListener('click', (e) => handleEditParticipantClick(parseInt(e.currentTarget.dataset.originalIndex)));
        });
        participantsList.querySelectorAll('.remove-participant-btn').forEach(btn => {
            btn.addEventListener('click', (e) => handleRemoveParticipantClick(parseInt(e.currentTarget.dataset.originalIndex)));
        });
    }

    function renderNeedsAttention(journey) {
        const listEl = document.getElementById('needs-attention-list');
        if (!listEl) return;
        listEl.innerHTML = '';
        const items = [];
        (journey.tasks || []).filter(t => t.assignee === currentUser.id && !t.completed)
            .forEach(t => items.push({ type: 'task', id: t.id, title: t.description || t.title || 'Task' }));
        (journey.tasks || []).filter(t => (t.interested || []).includes(currentUser.id))
            .forEach(t => items.push({ type: 'task', id: t.id, title: t.description || t.title || 'Task' }));
        (journey.commentHistory || []).filter(c => c.text.includes('@' + currentUser.name))
            .forEach(c => {
                const ctx = c.context || {};
                if (ctx.type === 'task') {
                    const t = (journey.tasks || []).find(x => x.id === ctx.id);
                    if (t) items.push({ type: 'task', id: t.id, title: t.description || t.title || 'Task' });
                } else if (ctx.type === 'document') {
                    const d = (journey.documents || []).find(x => x.id === ctx.id);
                    if (d) items.push({ type: 'document', id: d.id, title: d.name });
                }
            });
        const unique = [];
        items.forEach(i => {
            if (!unique.some(u => u.type === i.type && u.id === i.id)) {
                unique.push(i);
            }
        });
        if (unique.length === 0) {
            listEl.innerHTML = '<p class="text-placeholder">No items need attention.</p>';
            return;
        }
        unique.forEach(item => {
            const div = document.createElement('div');
            div.className = item.type === 'task' ? 'task-item' : 'document-item';
            div.innerHTML = `
                <div class="item-icon"><i class="fa-solid ${item.type === 'task' ? 'fa-list-check' : 'fa-folder-open'}"></i></div>
                <div class="item-info"><div class="item-title">${item.title}</div></div>
            `;
            div.style.cursor = 'pointer';
            div.addEventListener('click', () => {
                if (item.type === 'task') handleEditTaskClick(item.id);
                else handleEditDocumentClick(item.id);
            });
            listEl.appendChild(div);
        });
    }

    function renderDocuments(documents) {
        documentsList.innerHTML = '';
        const filterLabels = activeFilterLabels;
        const filtered = documents.filter(d => {
            if (filterLabels.length === 0) return true;
            const itemLabels = d.labels || [];
            return filterLabels.every(f => itemLabels.includes(f));
        });
        if (filtered.length === 0) {
            const msg = filterLabels.length > 0 ? 'No documents match the current filter.' : 'No documents added yet.';
            documentsList.innerHTML = `<p class="text-placeholder">${msg}</p>`;
            return;
        }
        filtered.sort((a, b) => new Date(b.added || 0) - new Date(a.added || 0));
        filtered.forEach(doc => {
            const div = document.createElement('div');
            div.className = 'document-item';
            div.dataset.documentId = doc.id;
            div.innerHTML = `
                <div class="item-icon"><i class="fa-solid fa-file-lines"></i></div>
                <div class="item-info">
                    <div class="item-title">${doc.name || 'Untitled Document'}</div>
                    <div class="item-meta">
                        <span class="meta-text">Added ${timeAgo(doc.added)} by ${doc.addedBy || 'Unknown'}</span>
                        ${formatLabels(doc.labels || [])}
                    </div>
                </div>
            `;
            div.addEventListener('click', () => handleEditDocumentClick(doc.id));
            documentsList.appendChild(div);
        });
    }

    function renderTasks(tasks) {
        tasksList.innerHTML = '';
        const filterLabels = activeFilterLabels;
        const filtered = tasks.filter(t => {
            if (filterLabels.length === 0) return true;
            const itemLabels = t.labels || [];
            return filterLabels.every(f => itemLabels.includes(f));
        });
        if (filtered.length === 0) {
            const msg = filterLabels.length > 0 ? 'No tasks match the current filter.' : 'No tasks added yet.';
            tasksList.innerHTML = `<p class="text-placeholder">${msg}</p>`;
            return;
        }
        filtered.forEach((task) => {
            const originalTaskIndex = tasks.findIndex(t => t.id === task.id);
            const div = document.createElement('div');
            div.className = 'task-item';
            div.dataset.taskId = task.id;
            div.style.opacity = task.completed ? 0.6 : 1;
            let content = '';
            const assigneeName = getParticipantName(task.assignee);
            const dueDateFormatted = task.dueDate ? `• Due: ${formatDate(task.dueDate)}` : '';
            const labelsFormatted = formatLabels(task.labels || []);
            if (task.type === 'checklist') {
                const completedItems = (task.items || []).filter(i => i.completed).length;
                const totalItems = (task.items || []).length;
                const progressText = totalItems > 0 ? `(${completedItems}/${totalItems})` : '';
                content = `
                    <div class="item-icon"><i class="fa-solid fa-list-check"></i></div>
                    <div class="item-info">
                        <div class="item-title">${task.title || 'Untitled Checklist'} ${progressText}</div>
                        <div class="item-meta">
                            <span class="meta-text">Assigned: ${assigneeName} ${dueDateFormatted}</span>
                            ${labelsFormatted}
                        </div>
                        ${(task.items || []).map((item, idx) => `
                            <div class="checklist-item">
                                <span class="custom-checkbox ${item.completed ? 'checked' : ''}" data-task-index="${originalTaskIndex}" data-item-index="${idx}"></span>
                                <span style="${item.completed ? 'text-decoration: line-through; color: #888;' : ''}">${item.text}</span>
                            </div>
                        `).join('')}
                    </div>
                `;
            } else {
                content = `
                    <div style="display: flex; align-items: flex-start; flex-grow: 1;">
                        <span class="custom-checkbox ${task.completed ? 'checked' : ''}" data-task-index="${originalTaskIndex}" style="margin-top: 2px;"></span>
                        <div class="item-info" style="margin-left: 5px;">
                            <div class="item-title" style="${task.completed ? 'text-decoration: line-through; color: #888;' : ''}">${task.description || 'Untitled Task'}</div>
                            <div class="item-meta">
                                <span class="meta-text">Assigned: ${assigneeName} ${dueDateFormatted}</span>
                                ${labelsFormatted}
                            </div>
                        </div>
                    </div>
                `;
            }
            div.innerHTML = content;
            div.addEventListener('click', (e) => {
                if (!e.target.classList.contains('custom-checkbox')) {
                    handleEditTaskClick(task.id);
                }
            });
            tasksList.appendChild(div);
        });
    }

    function renderCommentHistory(comments) {
        commentHistoryList.innerHTML = '';
        if (!comments || comments.length === 0) {
            commentHistoryList.innerHTML = '<p class="text-placeholder">No comments yet.</p>';
            return;
        }
        comments.forEach(comment => {
            const div = document.createElement('div');
            div.className = 'feed-item';
            let contextText = '';
            if (comment.context && activeJourneyId && db.journeys[activeJourneyId]) {
                const journey = db.journeys[activeJourneyId];
                if (comment.context.type === 'document') {
                    const doc = (journey.documents || []).find(d => d.id === comment.context.id);
                    if (doc) contextText = `on document "${doc.name.substring(0,20)}..."`;
                } else if (comment.context.type === 'task') {
                    const task = (journey.tasks || []).find(t => t.id === comment.context.id);
                    if (task) contextText = `on task "${(task.description || task.title || '').substring(0,20)}..."`;
                } else if (comment.context.type === 'journey') {
                    contextText = 'on the journey';
                }
            }
            const contextLink = contextText ? `<span class="text-muted" style="font-size: 11px;"> ${contextText}</span>` : '';
            div.innerHTML = `
                <div class="feed-dot"></div>
                <div class="feed-content">
                    <div class="feed-meta"><strong>${comment.user}</strong> • ${timeAgo(comment.time)} <span class="feed-phase">(${comment.phase})</span></div>
                    <div class="feed-text">${comment.text.replace(/@(\w+[\s\w]*)/g, '<strong>@$1</strong>')} ${contextLink}</div>
                </div>
            `;
            if (comment.context && activeJourneyId) {
                div.style.cursor = 'pointer';
                div.addEventListener('click', () => {
                    if (comment.context.type === 'task') {
                        handleEditTaskClick(comment.context.id);
                    } else if (comment.context.type === 'document') {
                        handleEditDocumentClick(comment.context.id);
                    }
                });
            }
            commentHistoryList.appendChild(div);
        });
    }

    function renderActivityLog(log) {
        activityLogList.innerHTML = '';
        if (!log || log.length === 0) {
            activityLogList.innerHTML = '<p class="text-placeholder">No activity yet.</p>';
            return;
        }
        log.forEach(entry => {
            const div = document.createElement('div');
            div.className = 'feed-item';
            div.innerHTML = `
                <div class="feed-dot" style="background-color: var(--secondary-color);"></div>
                <div class="feed-content">
                    <div class="feed-meta"><strong>${entry.user}</strong> • ${timeAgo(entry.time)} <span class="feed-phase">(${entry.phase})</span></div>
                    <div class="feed-text">${entry.action}</div>
                </div>
            `;
            activityLogList.appendChild(div);
        });
    }

    // People
    function renderPeople() {
        peopleListTbody.innerHTML = '';
        const peopleArray = Object.values(db.people);
        if (peopleArray.length === 0) {
            peopleListTbody.innerHTML = `<tr><td colspan="5" class="text-placeholder">No people found. Click 'Add Person' to create one.</td></tr>`;
            return;
        }
        peopleArray.sort((a, b) => (a.name || '').localeCompare(b.name || ''));
        peopleArray.forEach(p => {
            const tr = document.createElement('tr');
            tr.innerHTML = `
                <td>${p.name || 'N/A'}</td>
                <td>${p.title || 'N/A'}</td>
                <td>${p.company || 'N/A'}</td>
                <td>${formatLabels(p.labels || [])}</td>
                <td>
                    <button class="btn btn-sm btn-outline-primary edit-person-btn" data-id="${p.id}" title="Edit Person"><i class="fa-solid fa-pencil"></i></button>
                    <button class="btn btn-sm btn-outline-danger delete-person-btn" data-id="${p.id}" title="Delete Person"><i class="fa-solid fa-trash"></i></button>
                </td>
            `;
            peopleListTbody.appendChild(tr);
        });
        peopleListTbody.querySelectorAll('.edit-person-btn').forEach(btn => {
            btn.addEventListener('click', () => handleEditPersonClick(btn.dataset.id));
        });
        peopleListTbody.querySelectorAll('.delete-person-btn').forEach(btn => {
            btn.addEventListener('click', () => handleDeletePersonClick(btn.dataset.id));
        });
    }

    // Contracts
    function renderContracts() {
        contractsListTbody.innerHTML = '';
        const contractsArray = Object.values(db.contracts);
        if (contractsArray.length === 0) {
            contractsListTbody.innerHTML = `<tr><td colspan="5" class="text-placeholder">No contracts found. Click 'Add Contract' to create one.</td></tr>`;
            return;
        }
        contractsArray.sort((a, b) => (a.contractWith || '').localeCompare(b.contractWith || ''));
        contractsArray.forEach(c => {
            const tr = document.createElement('tr');
            tr.innerHTML = `
                <td>${c.contractWith || 'N/A'}</td>
                <td>${c.summary || 'N/A'}</td>
                <td>${formatDate(c.startDate)} - ${c.endDate ? formatDate(c.endDate) : 'Ongoing'}</td>
                <td>${(c.files || []).length} file(s)</td>
                <td>
                    <button class="btn btn-sm btn-outline-primary edit-contract-btn" data-id="${c.id}"><i class="fa-solid fa-pencil"></i></button>
                    <button class="btn btn-sm btn-outline-danger delete-contract-btn" data-id="${c.id}"><i class="fa-solid fa-trash"></i></button>
                </td>
            `;
            contractsListTbody.appendChild(tr);
        });
        contractsListTbody.querySelectorAll('.edit-contract-btn').forEach(btn => {
            btn.addEventListener('click', () => handleEditContractClick(btn.dataset.id));
        });
        contractsListTbody.querySelectorAll('.delete-contract-btn').forEach(btn => {
            btn.addEventListener('click', () => handleDeleteContractClick(btn.dataset.id));
        });
        // Settings fields
        if (milestonesEl) milestonesEl.value = (db.settings.defaultMilestones || []).join(', ');
        if (rolesEl) rolesEl.value = (db.settings.defaultRoles || []).join(', ');
        renderTemplates();
    }

    // File Box
    function renderFileBox() {
        fileboxList.innerHTML = '';
        if (!db.fileBox || db.fileBox.length === 0) {
            fileboxList.innerHTML = '<p class="text-placeholder">No files in the File Box yet.</p>';
            return;
        }
        db.fileBox.forEach(item => {
            const div = document.createElement('div');
            div.className = 'document-item';
            div.draggable = true; // Let user drag from here if they want
            div.dataset.fileboxId = item.id;
            div.addEventListener('dragstart', handleFileBoxDragStart);
            div.innerHTML = `
                <div class="item-icon"><i class="fa-solid fa-box-archive"></i></div>
                <div class="item-info">
                    <div class="item-title">${item.name || 'Unnamed File'}</div>
                    <div class="item-meta">
                        <span class="meta-text">${item.description || ''}</span>
                        ${formatLabels(item.labels || [])}
                    </div>
                </div>
            `;
            // Clicking will edit
            div.addEventListener('click', () => handleEditFileBoxClick(item.id));
            fileboxList.appendChild(div);
        });
    }

    // The portion of file box inside journey detail bottom
    function renderJourneyDetailFileBox() {
        const container = document.getElementById('journey-filebox-container');
        if (!container) return;
        container.innerHTML = '';
        if (!db.fileBox || db.fileBox.length === 0) {
            container.innerHTML = '<p class="text-placeholder">No files in the File Box yet.</p>';
            return;
        }
        db.fileBox.forEach(item => {
            const div = document.createElement('div');
            div.className = 'document-item';
            div.style.marginBottom = '10px';
            div.draggable = true;
            div.dataset.fileboxId = item.id;
            div.addEventListener('dragstart', handleFileBoxDragStart);
            div.innerHTML = `
                <div class="item-icon"><i class="fa-solid fa-box-archive"></i></div>
                <div class="item-info">
                    <div class="item-title">${item.name || 'Unnamed File'}</div>
                    <div class="item-meta">
                        <span class="meta-text">${item.description || ''}</span>
                        ${formatLabels(item.labels || [])}
                    </div>
                </div>
            `;
            container.appendChild(div);
        });
    }

    function handleFileBoxDragStart(e) {
        const fileboxId = e.currentTarget.dataset.fileboxId;
        e.dataTransfer.setData('text/plain', fileboxId);
        // We can set some drag image if we want
    }

    // Called when user drops onto the Documents area
    window.handleFileBoxDrop = function(event) {
        event.preventDefault();
        const fileboxId = event.dataTransfer.getData('text/plain');
        if (!fileboxId || !activeJourneyId) return;
        const item = db.fileBox.find(x => x.id === fileboxId);
        if (!item) return;
        // Create a new journey document from this item
        const newDoc = {
            id: generateId('d'),
            name: item.name,
            description: item.description,
            added: new Date().toISOString(),
            addedBy: currentUser.name,
            labels: [...(item.labels || [])],
            comments: []
        };
        const journey = db.journeys[activeJourneyId];
        if (!journey.documents) journey.documents = [];
        journey.documents.push(newDoc);
        logActivity(activeJourneyId, `Added document from FileBox: ${item.name}`);
        applyFiltersAndRerender();
    };

    // Settings - templates
    function renderTemplates() {
        if (!templateEntriesContainer) return;
        templateEntriesContainer.innerHTML = '';
        db.settings.templates.forEach((tmpl, idx) => {
            // tmpl = { id, name, type, content }
            const div = document.createElement('div');
            div.className = 'mb-2';
            div.innerHTML = `
                <div style="border:1px solid #ddd; padding:10px; border-radius:4px; margin-bottom:5px;">
                    <label style="font-size:13px;">Template Name</label>
                    <input type="text" class="form-control form-control-sm template-name" data-idx="${idx}" value="${tmpl.name}" style="margin-bottom:6px;">
                    <label style="font-size:13px;">Type</label>
                    <select class="form-control form-control-sm template-type" data-idx="${idx}" style="margin-bottom:6px;">
                        <option value="task" ${tmpl.type === 'task' ? 'selected' : ''}>Single Task</option>
                        <option value="checklist" ${tmpl.type === 'checklist' ? 'selected' : ''}>Checklist</option>
                    </select>
                    <label style="font-size:13px;">Content</label>
                    <textarea class="form-control form-control-sm template-content" rows="2" data-idx="${idx}" style="margin-bottom:6px;">${tmpl.content}</textarea>
                    <button class="btn btn-sm btn-outline-danger remove-template-btn" data-index="${idx}"><i class="fa-solid fa-trash"></i></button>
                </div>
            `;
            templateEntriesContainer.appendChild(div);
        });
        // Event handlers for removing
        templateEntriesContainer.querySelectorAll('.remove-template-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const i = parseInt(e.currentTarget.dataset.index);
                if (!isNaN(i)) {
                    db.settings.templates.splice(i, 1);
                    renderTemplates();
                }
            });
        });
        // Save changes on blur
        templateEntriesContainer.querySelectorAll('.template-name').forEach(inp => {
            inp.addEventListener('blur', (e) => {
                const i = parseInt(e.target.dataset.idx);
                db.settings.templates[i].name = e.target.value.trim();
            });
        });
        templateEntriesContainer.querySelectorAll('.template-type').forEach(sel => {
            sel.addEventListener('change', (e) => {
                const i = parseInt(e.target.dataset.idx);
                db.settings.templates[i].type = e.target.value;
            });
        });
        templateEntriesContainer.querySelectorAll('.template-content').forEach(txt => {
            txt.addEventListener('blur', (e) => {
                const i = parseInt(e.target.dataset.idx);
                db.settings.templates[i].content = e.target.value;
            });
        });
    }

    // --- EVENT HANDLERS ---

    // Nav
    navItems.journeys.addEventListener('click', () => showView('journey-overview'));
    navItems.people.addEventListener('click', () => { renderPeople(); showView('people'); });
    navItems.contracts.addEventListener('click', () => { renderContracts(); showView('contracts'); });
    navItems.filebox.addEventListener('click', () => { renderFileBox(); showView('filebox'); });
    navItems.settings.addEventListener('click', () => { renderContracts(); showView('settings'); });

    // Settings
    if (milestonesEl) {
        milestonesEl.addEventListener('change', () => {
            db.settings.defaultMilestones = milestonesEl.value.split(',').map(s => s.trim()).filter(Boolean);
        });
    }
    if (rolesEl) {
        rolesEl.addEventListener('change', () => {
            db.settings.defaultRoles = rolesEl.value.split(',').map(s => s.trim()).filter(Boolean);
        });
    }
    if (addTemplateBtn) {
        addTemplateBtn.addEventListener('click', () => {
            const newTmpl = {
                id: generateId('tmpl'),
                name: "New Template",
                type: "task",
                content: ""
            };
            db.settings.templates.push(newTmpl);
            renderTemplates();
        });
    }

    // Journey Overview
    function handleNewJourneyClick() {
        activeJourneyId = generateId('j');
        isNewJourney = true;
        const now = new Date().toISOString();
        const journeyName = "New Untitled Journey";
        const milestones = (db.settings && db.settings.defaultMilestones?.length > 0) ? [...db.settings.defaultMilestones] : [...defaultPhases];
        db.journeys[activeJourneyId] = {
            id: activeJourneyId,
            name: journeyName,
            contractors: [],
            location: [],
            tenants: [],
            phaseIndex: 0,
            assignedTo: currentUser.id,
            nextDeadline: null,
            status: milestones[0],
            lastUpdate: now,
            updatedBy: currentUser.name,
            description: "",
            customStatus: null,
            phases: milestones,
            participants: [
                { id: currentUser.id, name: currentUser.name, role: "Owner", labels: ["Creator"] }
            ],
            documents: [],
            tasks: [],
            activityLog: [
                {
                    time: now,
                    user: currentUser.name,
                    action: `Created Journey 'New Untitled Journey'`,
                    phase: milestones[0]
                }
            ],
            commentHistory: []
        };
        loadJourneyDetail(activeJourneyId);
        handleJourneyDetailsClick();
    }

    // Journey Detail
    function handleSaveChanges() {
        if (!activeJourneyId || !db.journeys[activeJourneyId]) return;
        const journey = db.journeys[activeJourneyId];
        const selectedStatus = journeyStatusSelect.value;
        if (selectedStatus === '__custom__') {
            const custom = journeyStatusCustom.value.trim();
            if (custom) {
                journey.customStatus = custom;
                journey.status = null;
            } else {
                journey.customStatus = null;
                journey.status = (journey.phases || defaultPhases)[journey.phaseIndex];
            }
        } else {
            journey.customStatus = null;
            journey.status = selectedStatus;
        }
        const actionText = isNewJourney ? `Saved new Journey '${journey.name}'` : `Saved changes to Journey '${journey.name}'`;
        logActivity(activeJourneyId, actionText);
        alert("Changes Locked In (Simulated Save)");
        isNewJourney = false;
        journeyStateText.textContent = "Adding to Journey";
        journeyStateText.style.color = "red";
        journeySaveButton.innerHTML = '<i class="fa-solid fa-lock"></i> Lock In Changes';
        renderJourneyOverview();
        loadJourneyDetail(activeJourneyId);
    }

    journeyStatusSelect.addEventListener('change', (e) => {
        if (e.target.value === '__custom__') {
            journeyStatusCustom.classList.remove('hidden');
            journeyStatusCustom.value = db.journeys[activeJourneyId]?.customStatus || '';
            journeyStatusCustom.focus();
        } else {
            journeyStatusCustom.classList.add('hidden');
            if (activeJourneyId && db.journeys[activeJourneyId]) {
                db.journeys[activeJourneyId].status = e.target.value;
                db.journeys[activeJourneyId].customStatus = null;
                logActivity(activeJourneyId, `Status changed to ${e.target.value}`);
            }
        }
    });

    journeyStatusCustom.addEventListener('blur', (e) => {
        if (!activeJourneyId || !db.journeys[activeJourneyId]) return;
        const val = e.target.value.trim();
        if (val) {
            db.journeys[activeJourneyId].customStatus = val;
            db.journeys[activeJourneyId].status = null;
            logActivity(activeJourneyId, `Status changed to custom: ${val}`);
            renderJourneyStatus(db.journeys[activeJourneyId]);
        } else {
            journeyStatusCustom.classList.add('hidden');
            db.journeys[activeJourneyId].customStatus = null;
            db.journeys[activeJourneyId].status = (db.journeys[activeJourneyId].phases || defaultPhases)[db.journeys[activeJourneyId].phaseIndex];
            renderJourneyStatus(db.journeys[activeJourneyId]);
        }
    });

    journeyStatusEditToggle.addEventListener('click', () => {
        journeyStatusSelect.value = '__custom__';
        journeyStatusCustom.classList.remove('hidden');
        journeyStatusCustom.value = db.journeys[activeJourneyId]?.customStatus || '';
        journeyStatusCustom.focus();
    });

    journeyDetailsButton.addEventListener('click', handleJourneyDetailsClick);
    editPhasesBtn.addEventListener('click', handleEditPhasesClick);
    advancePhaseBtn.addEventListener('click', handleAdvancePhaseClick);
    addParticipantBtn.addEventListener('click', handleAddParticipantClick);
    addDocumentBtn.addEventListener('click', handleAddDocumentClick);
    addTaskBtn.addEventListener('click', handleAddTaskClick);

    tasksList.addEventListener('click', (e) => {
        const checkbox = e.target.closest('.custom-checkbox');
        if (checkbox) {
            const taskIndex = parseInt(checkbox.dataset.taskIndex);
            const itemIndex = checkbox.dataset.itemIndex !== undefined ? parseInt(checkbox.dataset.itemIndex) : null;
            const journey = db.journeys[activeJourneyId];
            if (journey && journey.tasks && journey.tasks[taskIndex]) {
                const task = journey.tasks[taskIndex];
                let completed = checkbox.classList.toggle('checked');
                let logText = "";
                if (task.type === 'checklist' && itemIndex !== null && task.items && task.items[itemIndex]) {
                    task.items[itemIndex].completed = completed;
                    logText = `Checklist item "${task.items[itemIndex].text}" marked as ${completed ? 'complete' : 'incomplete'} in task "${task.title}"`;
                    applyFiltersAndRerender();
                } else if (task.type === 'task') {
                    task.completed = completed;
                    logText = `Task "${task.description}" marked as ${completed ? 'complete' : 'incomplete'}`;
                    applyFiltersAndRerender();
                }
                if (logText) {
                    logActivity(activeJourneyId, logText);
                }
            }
        }
    });

    function handleJourneyDetailsClick() {
        if (!activeJourneyId || !db.journeys[activeJourneyId]) return;
        const journey = db.journeys[activeJourneyId];
        document.getElementById('modal-journey-name').value = journey.name || '';
        document.getElementById('modal-journey-description').value = journey.description || '';
        setupTagInput('modal-journey-contractors', journey.contractors || []);
        setupTagInput('modal-journey-location', journey.location || []);
        setupTagInput('modal-journey-tenants', journey.tenants || []);
        showModal(journeyDetailsModal);
    }

    document.getElementById('save-journey-details-btn').addEventListener('click', () => {
        if (!activeJourneyId || !db.journeys[activeJourneyId]) return;
        const journey = db.journeys[activeJourneyId];
        const oldName = journey.name;
        journey.name = document.getElementById('modal-journey-name').value.trim() || 'Untitled Journey';
        journey.description = document.getElementById('modal-journey-description').value.trim();
        journey.contractors = getTagsFromInput('modal-journey-contractors');
        journey.location = getTagsFromInput('modal-journey-location');
        journey.tenants = getTagsFromInput('modal-journey-tenants');

        if (journey.name !== oldName) {
            logActivity(activeJourneyId, `Journey name changed from "${oldName}" to "${journey.name}"`);
            headerTitle.textContent = `Journey: ${journey.name}`;
        } else {
            logActivity(activeJourneyId, `Journey details updated`);
        }

        journeyDetailTitle.textContent = journey.name;
        renderJourneyOverview();
        hideModal(journeyDetailsModal);
    });

    function handleEditPhasesClick() {
        if (!activeJourneyId || !db.journeys[activeJourneyId]) return;
        const journey = db.journeys[activeJourneyId];
        renderPhasesForEditModal(journey.phases || defaultPhases);
        showModal(editPhasesModal);
    }

    function renderPhasesForEditModal(phases) {
        const list = document.getElementById('modal-phases-list');
        list.innerHTML = '';
        phases.forEach((phaseName, index) => {
            const li = document.createElement('li');
            li.className = 'list-group-item';
            li.innerHTML = `
                <span>${phaseName}</span>
                <button class="btn btn-sm btn-outline-danger delete-phase-btn" data-index="${index}" title="Delete Phase">
                    <i class="fa-solid fa-trash-alt"></i>
                </button>
            `;
            list.appendChild(li);
        });
        list.querySelectorAll('.delete-phase-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const idx = parseInt(e.currentTarget.dataset.index);
                const currentPhaseIndex = db.journeys[activeJourneyId]?.phaseIndex;
                if (idx === currentPhaseIndex) {
                    alert("Cannot delete the currently active phase.");
                    return;
                }
                e.currentTarget.closest('li').remove();
            });
        });
    }

    document.getElementById('add-new-phase-btn').addEventListener('click', () => {
        const input = document.getElementById('new-phase-name');
        const name = input.value.trim();
        if (name) {
            const list = document.getElementById('modal-phases-list');
            const li = document.createElement('li');
            li.className = 'list-group-item';
            li.innerHTML = `
                <span>${name}</span>
                <button class="btn btn-sm btn-outline-danger delete-phase-btn" title="Delete Phase">
                    <i class="fa-solid fa-trash-alt"></i>
                </button>
            `;
            list.appendChild(li);
            input.value = '';
            li.querySelector('.delete-phase-btn').addEventListener('click', (e) => {
                e.currentTarget.closest('li').remove();
            });
        }
    });

    document.getElementById('save-phases-btn').addEventListener('click', () => {
        if (!activeJourneyId || !db.journeys[activeJourneyId]) return;
        const journey = db.journeys[activeJourneyId];
        const newPhases = [];
        document.getElementById('modal-phases-list').querySelectorAll('li span').forEach(span => {
            newPhases.push(span.textContent);
        });
        if (newPhases.length === 0) {
            alert("Cannot save with no phases!");
            return;
        }
        const currentPhaseName = (journey.phases || defaultPhases)[journey.phaseIndex];
        const newIndex = newPhases.indexOf(currentPhaseName);
        journey.phases = newPhases;
        journey.phaseIndex = (newIndex !== -1) ? newIndex : 0;
        logActivity(activeJourneyId, "Journey phases updated");
        renderJourneyPhases(journey.phases, journey.phaseIndex);
        advancePhaseBtn.disabled = journey.phaseIndex >= journey.phases.length - 1;
        hideModal(editPhasesModal);
    });

    function handleAdvancePhaseClick() {
        if (!activeJourneyId || !db.journeys[activeJourneyId]) return;
        const journey = db.journeys[activeJourneyId];
        const currentPhases = journey.phases || defaultPhases;
        if (journey.phaseIndex < currentPhases.length - 1) {
            journey.phaseIndex++;
            journey.status = currentPhases[journey.phaseIndex];
            journey.customStatus = null;
            logActivity(activeJourneyId, `Advanced to phase: ${journey.status}`);
            const phaseComment = prompt('Add comment for phase transition (optional):');
            if (phaseComment && phaseComment.trim()) {
                addComment(activeJourneyId, { type: 'journey' }, phaseComment.trim());
                logActivity(activeJourneyId, `Comment on phase '${journey.status}': "${phaseComment.trim()}"`);
            }
            renderJourneyPhases(currentPhases, journey.phaseIndex);
            renderJourneyStatus(journey);
            advancePhaseBtn.disabled = journey.phaseIndex >= currentPhases.length - 1;
            renderJourneyOverview();
        }
    }

    // Participants
    function handleAddParticipantClick() {
        document.getElementById('participant-modal-title').textContent = "Add Participant";
        document.getElementById('edit-participant-index').value = "";
        document.getElementById('participant-name').value = "";
        document.getElementById('participant-role').value = "Contractor";
        document.getElementById('participant-labels').value = "";
        document.getElementById('participant-search').value = "";
        document.getElementById('participant-picklist').innerHTML = "";
        document.getElementById('participant-picklist').style.display = 'none';
        showModal(participantModal);
    }

    function handleEditParticipantClick(originalIndex) {
        if (!activeJourneyId || !db.journeys[activeJourneyId]) return;
        const participants = db.journeys[activeJourneyId].participants || [];
        if (originalIndex < 0 || originalIndex >= participants.length) return;
        const participant = participants[originalIndex];
        document.getElementById('participant-modal-title').textContent = "Edit Participant";
        document.getElementById('edit-participant-index').value = originalIndex;
        document.getElementById('participant-name').value = participant.name || "";
        document.getElementById('participant-role').value = participant.role || "Contractor";
        document.getElementById('participant-labels').value = (participant.labels || []).join(', ');
        document.getElementById('participant-search').value = "";
        document.getElementById('participant-picklist').innerHTML = "";
        document.getElementById('participant-picklist').style.display = 'none';
        showModal(participantModal);
    }

    function handleRemoveParticipantClick(originalIndex) {
        if (!activeJourneyId || !db.journeys[activeJourneyId]) return;
        const participants = db.journeys[activeJourneyId].participants || [];
        if (originalIndex < 0 || originalIndex >= participants.length) return;
        const part = participants[originalIndex];
        if (confirm(`Remove participant "${part.name}" from this journey?`)) {
            participants.splice(originalIndex, 1);
            logActivity(activeJourneyId, `Removed participant: ${part.name}`);
            applyFiltersAndRerender();
            renderJourneyOverview();
        }
    }

    document.getElementById('participant-search').addEventListener('input', (e) => {
        const searchTerm = e.target.value.toLowerCase();
        const picklist = document.getElementById('participant-picklist');
        picklist.innerHTML = '';
        picklist.style.display = 'none';
        if (searchTerm.length < 2) return;

        const journeyParticipantIds = (db.journeys[activeJourneyId]?.participants || []).map(p => p.id);

        Object.values(db.people)
            .filter(p => !journeyParticipantIds.includes(p.id))
            .filter(p => p.name.toLowerCase().includes(searchTerm) || (p.company || '').toLowerCase().includes(searchTerm))
            .slice(0, 10)
            .forEach(p => {
                const div = document.createElement('div');
                div.className = 'list-group-item list-group-item-action cursor-pointer';
                div.innerHTML = `<strong>${p.name}</strong> <small>(${p.company || 'N/A'})</small>`;
                div.onclick = () => {
                    document.getElementById('participant-name').value = p.name;
                    document.getElementById('participant-name').dataset.selectedPersonId = p.id;
                    document.getElementById('participant-labels').value = (p.labels || []).join(', ');
                    picklist.innerHTML = '';
                    picklist.style.display = 'none';
                };
                picklist.appendChild(div);
            });
        if (picklist.children.length > 0) {
            picklist.style.display = 'block';
        }
    });

    document.getElementById('participant-search').addEventListener('blur', () => {
        setTimeout(() => {
            if (!participantModal.contains(document.activeElement)) {
                document.getElementById('participant-picklist').style.display = 'none';
            }
        }, 200);
    });

    document.getElementById('save-participant-btn').addEventListener('click', () => {
        if (!activeJourneyId || !db.journeys[activeJourneyId]) return;
        const journey = db.journeys[activeJourneyId];
        const nameInput = document.getElementById('participant-name');
        const name = nameInput.value.trim();
        const role = document.getElementById('participant-role').value;
        const labels = parseLabels(document.getElementById('participant-labels').value);
        const editIndexStr = document.getElementById('edit-participant-index').value;
        const selectedPersonId = nameInput.dataset.selectedPersonId;

        if (!name || !role) {
            alert("Participant name and role are required.");
            return;
        }
        const participantId = selectedPersonId || generateId('p');
        const participantData = { id: participantId, name, role, labels };
        delete nameInput.dataset.selectedPersonId;

        if (editIndexStr) {
            const idx = parseInt(editIndexStr);
            if (idx >= 0 && journey.participants[idx]) {
                journey.participants[idx] = { ...journey.participants[idx], ...participantData };
                logActivity(activeJourneyId, `Updated participant: ${name}`);
            }
        } else {
            if (journey.participants.some(p => p.id === participantId)) {
                alert(`"${name}" is already a participant in this journey.`);
                return;
            }
            journey.participants.push(participantData);
            logActivity(activeJourneyId, `Added participant: ${name} (${role})`);
        }
        applyFiltersAndRerender();
        renderJourneyOverview();
        hideModal(participantModal);
    });

    // Documents
    function handleAddDocumentClick() {
        document.getElementById('document-modal-title').textContent = "Add Document";
        document.getElementById('edit-document-id').value = "";
        document.getElementById('document-name').value = "";
        document.getElementById('document-description').value = "";
        document.getElementById('document-file').value = "";
        document.getElementById('document-labels').value = "";
        renderModalComments('document-comments-list', []);
        document.getElementById('document-new-comment').value = "";
        showModal(documentModal);
    }

    function handleEditDocumentClick(docId) {
        if (!activeJourneyId || !db.journeys[activeJourneyId]) return;
        const journey = db.journeys[activeJourneyId];
        const doc = (journey.documents || []).find(d => d.id === docId);
        if (!doc) return;
        document.getElementById('document-modal-title').textContent = "Edit Document";
        document.getElementById('edit-document-id').value = doc.id;
        document.getElementById('document-name').value = doc.name || "";
        document.getElementById('document-description').value = doc.description || "";
        document.getElementById('document-file').value = "";
        document.getElementById('document-labels').value = (doc.labels || []).join(', ');
        renderModalComments('document-comments-list', doc.comments || []);
        document.getElementById('document-new-comment').value = "";
        showModal(documentModal);
    }

    document.getElementById('save-document-btn').addEventListener('click', () => {
        if (!activeJourneyId || !db.journeys[activeJourneyId]) return;
        const journey = db.journeys[activeJourneyId];
        const docName = document.getElementById('document-name').value.trim();
        const docDesc = document.getElementById('document-description').value.trim();
        const fileInput = document.getElementById('document-file');
        const labels = parseLabels(document.getElementById('document-labels').value);
        const editId = document.getElementById('edit-document-id').value;

        if (!docName) {
            alert("Document name is required.");
            return;
        }
        if (editId) {
            const idx = (journey.documents || []).findIndex(d => d.id === editId);
            if (idx > -1) {
                const docObj = journey.documents[idx];
                docObj.name = docName;
                docObj.description = docDesc;
                docObj.labels = labels;
                if (fileInput.files.length > 0) {
                    // Simulate new file
                    // docObj.added = new Date().toISOString();
                    // docObj.addedBy = currentUser.name;
                }
                logActivity(activeJourneyId, `Updated document: ${docName}`);
            }
        } else {
            const newDoc = {
                id: generateId('d'),
                name: docName,
                description: docDesc,
                added: new Date().toISOString(),
                addedBy: currentUser.name,
                labels: labels,
                comments: []
            };
            journey.documents.push(newDoc);
            logActivity(activeJourneyId, `Added document: ${docName}`);
        }
        applyFiltersAndRerender();
        hideModal(documentModal);
    });

    document.getElementById('add-document-comment-btn').addEventListener('click', () => {
        const docId = document.getElementById('edit-document-id').value;
        const text = document.getElementById('document-new-comment').value;
        if (text && docId && activeJourneyId) {
            const itemUpdated = addComment(activeJourneyId, { type: 'document', id: docId }, text);
            if (itemUpdated) {
                const doc = db.journeys[activeJourneyId].documents.find(d => d.id === docId);
                renderModalComments('document-comments-list', doc?.comments || []);
            }
            document.getElementById('document-new-comment').value = '';
        }
    });

    // Tasks
    function handleAddTaskClick() {
        document.getElementById('task-modal-title').textContent = "Add Task / Checklist";
        document.getElementById('edit-task-id').value = "";
        document.querySelector('input[name="task-type"][value="task"]').checked = true;
        toggleTaskTypeFields('task');
        document.getElementById('task-description').value = "";
        document.getElementById('checklist-title').value = "";
        document.getElementById('checklist-items-container').innerHTML = '';
        addChecklistItemInput();
        populateParticipantDropdown('task-assignee');
        populateParticipantDropdown('task-interested', true);
        document.getElementById('task-due-date').value = "";
        document.getElementById('task-labels').value = "";
        renderModalComments('task-comments-list', []);
        document.getElementById('task-new-comment').value = "";
        // Populate "Load From Template"
        renderTaskTemplateSelect("");
        showModal(taskModal);
    }

    function handleEditTaskClick(taskId) {
        if (!activeJourneyId || !db.journeys[activeJourneyId]) return;
        const journey = db.journeys[activeJourneyId];
        const task = (journey.tasks || []).find(t => t.id === taskId);
        if (!task) return;
        document.getElementById('task-modal-title').textContent = "Edit Task / Checklist";
        document.getElementById('edit-task-id').value = task.id;
        document.querySelector(`input[name="task-type"][value="${task.type}"]`).checked = true;
        toggleTaskTypeFields(task.type);

        if (task.type === 'task') {
            document.getElementById('task-description').value = task.description || "";
        } else {
            document.getElementById('checklist-title').value = task.title || "";
            const container = document.getElementById('checklist-items-container');
            container.innerHTML = '';
            (task.items || []).forEach(it => addChecklistItemInput(it.text));
            if (!task.items || task.items.length === 0) addChecklistItemInput();
        }
        populateParticipantDropdown('task-assignee', false, task.assignee);
        populateParticipantDropdown('task-interested', true, task.interested || []);
        document.getElementById('task-due-date').value = task.dueDate || "";
        document.getElementById('task-labels').value = (task.labels || []).join(', ');
        renderModalComments('task-comments-list', task.comments || []);
        document.getElementById('task-new-comment').value = "";
        renderTaskTemplateSelect("");
        showModal(taskModal);
    }

    function renderTaskTemplateSelect(selectedTemplateId) {
        const select = document.getElementById('task-template-select');
        if (!select) return;
        select.innerHTML = '<option value="">-- No Template --</option>';
        db.settings.templates.forEach(tmpl => {
            const opt = document.createElement('option');
            opt.value = tmpl.id;
            opt.textContent = tmpl.name;
            select.appendChild(opt);
        });
        select.value = selectedTemplateId || "";
    }

    document.getElementById('task-template-select').addEventListener('change', (e) => {
        const tmplId = e.target.value;
        if (!tmplId) return;
        const tmpl = db.settings.templates.find(t => t.id === tmplId);
        if (!tmpl) return;
        // Apply the template
        const type = tmpl.type;
        document.querySelector(`input[name="task-type"][value="${type}"]`).checked = true;
        toggleTaskTypeFields(type);
        if (type === 'task') {
            document.getElementById('task-description').value = tmpl.content;
        } else {
            document.getElementById('checklist-title').value = tmpl.name;
            const lines = tmpl.content.split('\n').map(l => l.trim()).filter(Boolean);
            const container = document.getElementById('checklist-items-container');
            container.innerHTML = '';
            if (lines.length === 0) lines.push("");
            lines.forEach(line => addChecklistItemInput(line));
        }
    });

    document.querySelectorAll('input[name="task-type"]').forEach(radio => {
        radio.addEventListener('change', (e) => toggleTaskTypeFields(e.target.value));
    });

    function toggleTaskTypeFields(type) {
        if (type === 'task') {
            document.getElementById('task-single-fields').classList.remove('hidden');
            document.getElementById('task-checklist-fields').classList.add('hidden');
        } else {
            document.getElementById('task-single-fields').classList.add('hidden');
            document.getElementById('task-checklist-fields').classList.remove('hidden');
            if (document.getElementById('checklist-items-container').children.length === 0) {
                addChecklistItemInput();
            }
        }
    }

    document.getElementById('add-checklist-item-btn').addEventListener('click', () => addChecklistItemInput());

    function addChecklistItemInput(value = '') {
        const container = document.getElementById('checklist-items-container');
        const div = document.createElement('div');
        div.className = 'checklist-item-input-group';
        div.innerHTML = `
            <input type="text" class="form-control form-control-sm checklist-item-input" placeholder="Checklist item" value="${value}">
            <button type="button" class="btn btn-sm btn-outline-danger remove-checklist-item-btn" title="Remove Item"><i class="fa-solid fa-trash-alt"></i></button>
        `;
        div.querySelector('.remove-checklist-item-btn').addEventListener('click', (e) => {
            if (container.children.length > 1) {
                e.currentTarget.closest('.checklist-item-input-group').remove();
            } else {
                alert("A checklist must have at least one item.");
            }
        });
        container.appendChild(div);
    }

    function populateParticipantDropdown(selectId, allowMultiple = false, selectedValue = null) {
        const select = document.getElementById(selectId);
        if (!select) return;
        select.innerHTML = '<option value="">-- Select --</option>';
        if (!activeJourneyId || !db.journeys[activeJourneyId]?.participants) return;
        const participants = db.journeys[activeJourneyId].participants;
        participants.forEach(p => {
            const opt = document.createElement('option');
            opt.value = p.id;
            opt.textContent = `${p.name} (${p.role})`;
            select.appendChild(opt);
        });
        select.multiple = allowMultiple;
        if (allowMultiple) {
            if (selectedValue && Array.isArray(selectedValue)) {
                Array.from(select.options).forEach(opt => {
                    if (selectedValue.includes(opt.value)) {
                        opt.selected = true;
                    }
                });
            }
        } else {
            if (selectedValue) {
                select.value = selectedValue;
            }
        }
    }

    document.getElementById('save-task-btn').addEventListener('click', () => {
        if (!activeJourneyId || !db.journeys[activeJourneyId]) return;
        const journey = db.journeys[activeJourneyId];
        const type = document.querySelector('input[name="task-type"]:checked').value;
        const assignee = document.getElementById('task-assignee').value;
        const interested = Array.from(document.getElementById('task-interested').selectedOptions).map(opt => opt.value);
        const dueDate = document.getElementById('task-due-date').value || null;
        const labels = parseLabels(document.getElementById('task-labels').value);
        const editId = document.getElementById('edit-task-id').value;

        const newTaskData = { type, assignee, interested, dueDate, labels, comments: [] };
        let logText = "";

        if (type === 'task') {
            newTaskData.description = document.getElementById('task-description').value.trim();
            if (!newTaskData.description) {
                alert("Task description is required.");
                return;
            }
            newTaskData.completed = false;
            logText = `Task: ${newTaskData.description}`;
        } else {
            newTaskData.title = document.getElementById('checklist-title').value.trim();
            if (!newTaskData.title) {
                alert("Checklist title is required.");
                return;
            }
            newTaskData.items = [];
            document.querySelectorAll('.checklist-item-input').forEach(inp => {
                const text = inp.value.trim();
                if (text) newTaskData.items.push({ text, completed: false });
            });
            if (newTaskData.items.length === 0) {
                alert("Checklist must have at least one item.");
                return;
            }
            newTaskData.completed = false;
            logText = `Checklist: ${newTaskData.title}`;
        }

        if (editId) {
            const idx = (journey.tasks || []).findIndex(t => t.id === editId);
            if (idx > -1) {
                const existing = journey.tasks[idx];
                newTaskData.comments = existing.comments || [];
                if (existing.type === 'task') {
                    newTaskData.completed = existing.completed;
                } else {
                    const oldItems = existing.items || [];
                    newTaskData.items = newTaskData.items.map(newIt => {
                        const match = oldItems.find(oi => oi.text === newIt.text);
                        return { ...newIt, completed: match ? match.completed : false };
                    });
                }
                journey.tasks[idx] = { ...existing, ...newTaskData };
                logActivity(activeJourneyId, `Updated ${logText}`);
            }
        } else {
            newTaskData.id = generateId('t');
            if (!journey.tasks) journey.tasks = [];
            journey.tasks.push(newTaskData);
            logActivity(activeJourneyId, `Added ${logText}`);
        }
        applyFiltersAndRerender();
        hideModal(taskModal);
    });

    document.getElementById('add-task-comment-btn').addEventListener('click', () => {
        const text = document.getElementById('task-new-comment').value;
        const taskId = document.getElementById('edit-task-id').value;
        if (text && taskId && activeJourneyId) {
            const itemUpdated = addComment(activeJourneyId, { type: 'task', id: taskId }, text);
            if (itemUpdated) {
                const t = db.journeys[activeJourneyId].tasks.find(x => x.id === taskId);
                renderModalComments('task-comments-list', t?.comments || []);
            }
            document.getElementById('task-new-comment').value = '';
        }
    });

    // People
    function handleAddPersonClick() {
        document.getElementById('person-modal-title').textContent = "Add Person";
        document.getElementById('edit-person-id').value = "";
        document.getElementById('person-name').value = "";
        document.getElementById('person-title').value = "";
        document.getElementById('person-company').value = "";
        document.getElementById('person-image').value = "";
        document.getElementById('person-labels').value = "";
        showModal(personModal);
    }

    function handleEditPersonClick(personId) {
        const person = db.people[personId];
        if (!person) return;
        document.getElementById('person-modal-title').textContent = "Edit Person";
        document.getElementById('edit-person-id').value = person.id;
        document.getElementById('person-name').value = person.name;
        document.getElementById('person-title').value = person.title;
        document.getElementById('person-company').value = person.company;
        document.getElementById('person-image').value = person.image;
        document.getElementById('person-labels').value = (person.labels || []).join(', ');
        showModal(personModal);
    }

    function handleDeletePersonClick(personId) {
        const p = db.people[personId];
        if (!p) return;
        const inJourney = Object.values(db.journeys).some(j => (j.participants || []).some(px => px.id === personId));
        if (inJourney) {
            alert(`Cannot delete "${p.name}" because they are a participant in one or more journeys.`);
            return;
        }
        if (confirm(`Delete ${p.name}? This cannot be undone.`)) {
            delete db.people[personId];
            alert("Person deleted.");
            renderPeople();
        }
    }

    document.getElementById('save-person-btn').addEventListener('click', () => {
        const editId = document.getElementById('edit-person-id').value;
        const name = document.getElementById('person-name').value.trim();
        if (!name) {
            alert("Person name is required.");
            return;
        }
        const personData = {
            name,
            title: document.getElementById('person-title').value.trim(),
            company: document.getElementById('person-company').value.trim(),
            image: document.getElementById('person-image').value.trim(),
            labels: parseLabels(document.getElementById('person-labels').value)
        };
        if (editId) {
            db.people[editId] = { ...db.people[editId], ...personData };
            alert("Person updated.");
        } else {
            const newId = generateId('p');
            personData.id = newId;
            db.people[newId] = personData;
            alert("Person added.");
        }
        renderPeople();
        hideModal(personModal);
    });

    // Contracts
    function handleAddContractClick() {
        document.getElementById('contract-modal-title').textContent = "Add Contract";
        document.getElementById('edit-contract-id').value = "";
        document.getElementById('contract-with').value = "";
        document.getElementById('contract-summary').value = "";
        document.getElementById('contract-start-date').value = "";
        document.getElementById('contract-end-date').value = "";
        document.getElementById('contract-files').value = "";
        document.getElementById('contract-file-list').innerHTML = "";
        showModal(contractModal);
    }

    function handleEditContractClick(contractId) {
        const c = db.contracts[contractId];
        if (!c) return;
        document.getElementById('contract-modal-title').textContent = "Edit Contract";
        document.getElementById('edit-contract-id').value = c.id;
        document.getElementById('contract-with').value = c.contractWith || "";
        document.getElementById('contract-summary').value = c.summary || "";
        document.getElementById('contract-start-date').value = c.startDate || "";
        document.getElementById('contract-end-date').value = c.endDate || "";
        document.getElementById('contract-files').value = "";
        const ul = document.getElementById('contract-file-list');
        ul.innerHTML = '';
        (c.files || []).forEach(f => {
            const li = document.createElement('li');
            li.className = 'list-group-item py-1';
            li.textContent = f;
            ul.appendChild(li);
        });
        showModal(contractModal);
    }

    function handleDeleteContractClick(contractId) {
        const c = db.contracts[contractId];
        if (!c) return;
        if (confirm(`Delete contract with ${c.contractWith}?`)) {
            delete db.contracts[contractId];
            alert("Contract deleted.");
            renderContracts();
        }
    }

    document.getElementById('save-contract-btn').addEventListener('click', () => {
        const editId = document.getElementById('edit-contract-id').value;
        const contractWith = document.getElementById('contract-with').value.trim();
        if (!contractWith) {
            alert("Contract With field is required.");
            return;
        }
        const fileInput = document.getElementById('contract-files');
        let existingFiles = [];
        if (editId && db.contracts[editId]) {
            existingFiles = db.contracts[editId].files || [];
        }
        if (fileInput.files.length > 0) {
            existingFiles = Array.from(fileInput.files).map(x => x.name);
        }
        const contractData = {
            contractWith,
            summary: document.getElementById('contract-summary').value.trim(),
            startDate: document.getElementById('contract-start-date').value || null,
            endDate: document.getElementById('contract-end-date').value || null,
            files: existingFiles
        };
        if (editId) {
            db.contracts[editId] = { ...db.contracts[editId], ...contractData };
            alert("Contract updated.");
        } else {
            const newId = generateId('c');
            contractData.id = newId;
            db.contracts[newId] = contractData;
            alert("Contract added.");
        }
        renderContracts();
        hideModal(contractModal);
    });

    // File Box
    function handleAddFileBoxClick() {
        document.getElementById('filebox-modal-title').textContent = "Add File";
        document.getElementById('edit-filebox-id').value = "";
        document.getElementById('filebox-name').value = "";
        document.getElementById('filebox-description').value = "";
        document.getElementById('filebox-labels').value = "";
        showModal(fileboxModal);
    }
    addFileboxButton?.addEventListener('click', handleAddFileBoxClick);

    function handleEditFileBoxClick(fileboxId) {
        const item = db.fileBox.find(x => x.id === fileboxId);
        if (!item) return;
        document.getElementById('filebox-modal-title').textContent = "Edit File";
        document.getElementById('edit-filebox-id').value = item.id;
        document.getElementById('filebox-name').value = item.name;
        document.getElementById('filebox-description').value = item.description;
        document.getElementById('filebox-labels').value = (item.labels || []).join(', ');
        showModal(fileboxModal);
    }

    document.getElementById('save-filebox-btn').addEventListener('click', () => {
        const editId = document.getElementById('edit-filebox-id').value;
        const name = document.getElementById('filebox-name').value.trim();
        if (!name) {
            alert("File name is required.");
            return;
        }
        const desc = document.getElementById('filebox-description').value.trim();
        const labels = parseLabels(document.getElementById('filebox-labels').value);
        if (editId) {
            const idx = db.fileBox.findIndex(x => x.id === editId);
            if (idx > -1) {
                db.fileBox[idx].name = name;
                db.fileBox[idx].description = desc;
                db.fileBox[idx].labels = labels;
            }
        } else {
            const newItem = {
                id: generateId('fb'),
                name: name,
                description: desc,
                labels: labels
            };
            db.fileBox.push(newItem);
        }
        hideModal(fileboxModal);
        if (currentView === 'filebox') {
            renderFileBox();
        } else if (currentView === 'journey-detail') {
            renderJourneyDetailFileBox();
        }
    });

    // Generic modal closers
    document.querySelectorAll('[data-dismiss="modal"]').forEach(btn => {
        btn.addEventListener('click', () => hideModal(btn.closest('.modal-backdrop')));
    });
    document.querySelectorAll('.modal-backdrop').forEach(backdrop => {
        backdrop.addEventListener('click', (e) => {
            if (e.target === backdrop) {
                hideModal(backdrop);
            }
        });
    });

    // Tag Input
    function setupTagInput(containerId, initialTags = []) {
        const container = document.getElementById(containerId);
        if (!container) return;
        container.querySelectorAll('.tag-item').forEach(t => t.remove());
        let input = container.querySelector('input');
        if (!input) {
            input = document.createElement('input');
            input.type = 'text';
            container.appendChild(input);
        } else {
            input.value = '';
        }
        initialTags.forEach(t => addTag(container, input, t));
        const newInput = input.cloneNode(true);
        container.replaceChild(newInput, input);
        input = newInput;
        input.addEventListener('keydown', (e) => {
            if ((e.key === 'Enter' || e.key === 'Tab') && input.value.trim() !== '') {
                e.preventDefault();
                addTag(container, input, input.value.trim());
                input.value = '';
            } else if (e.key === 'Backspace' && input.value === '') {
                const lastTag = container.querySelector('.tag-item:last-of-type');
                if (lastTag) lastTag.remove();
            }
        });
        input.addEventListener('blur', () => {
            if (input.value.trim() !== '') {
                addTag(container, input, input.value.trim());
                input.value = '';
            }
        });
        container.addEventListener('click', (e) => {
            if (e.target.classList.contains('remove-tag')) {
                e.target.closest('.tag-item').remove();
            }
        });
    }

    function addTag(container, input, tagText) {
        const existing = getTagsFromInput(container.id);
        if (existing.includes(tagText)) {
            input.value = '';
            return;
        }
        const tag = document.createElement('span');
        tag.className = 'tag-item';
        tag.textContent = tagText;
        const removeBtn = document.createElement('span');
        removeBtn.className = 'remove-tag';
        removeBtn.innerHTML = '&times;';
        removeBtn.title = 'Remove tag';
        tag.appendChild(removeBtn);
        container.insertBefore(tag, input);
    }

    function getTagsFromInput(containerId) {
        const c = document.getElementById(containerId);
        if (!c) return [];
        const tags = [];
        c.querySelectorAll('.tag-item').forEach(t => {
            tags.push(t.firstChild.textContent.trim());
        });
        return tags;
    }

    function renderModalComments(listId, comments) {
        const list = document.getElementById(listId);
        list.innerHTML = '';
        if (!comments || comments.length === 0) {
            list.innerHTML = '<p class="text-placeholder">No comments yet.</p>';
            return;
        }
        const sorted = [...comments].sort((a,b) => new Date(a.time || 0) - new Date(b.time || 0));
        sorted.forEach(c => {
            const div = document.createElement('div');
            div.className = 'comment-item';
            div.innerHTML = `
                <div class="comment-meta"><strong>${c.by || c.user || 'Unknown'}</strong> <span class="time">${formatDateTime(c.time)}</span></div>
                <div class="comment-text">${c.text.replace(/@(\w+[\s\w]*)/g, '<strong>@$1</strong>')}</div>
            `;
            list.appendChild(div);
        });
        list.scrollTop = list.scrollHeight;
    }

    // Initial
    renderJourneyOverview();
    updateHeader();
    updateNav();
});