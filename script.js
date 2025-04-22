document.addEventListener('DOMContentLoaded', function() {
    // --- Global State & Data ---
    let currentView = 'journey-overview'; // journey-overview, journey-detail, people, contracts
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
                contractors: ["ConstructCo", "DesignBuild Inc."], // Keep for quick display/filtering if needed
                location: ["123 Main St, Anytown USA"],
                tenants: ["TechCorp"], // Keep for quick display/filtering if needed
                phaseIndex: 2, // Response
                assignedTo: "p2", // ID of participant who needs to act next
                nextDeadline: "2024-08-15",
                status: "Response", // Maps to phase name for simplicity here
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
                    { id: "p5", name: "Bob Jones", role: "Owner", labels: ["Finance"] }, // Another owner role
                ],
                documents: [
                    { id: "d1", name: "RFP Package v1.pdf", added: "2024-07-20T09:00:00Z", addedBy: "Alice Martin", labels: ["RFP", "Critical"], comments: [{by: "Alice Martin", time: "2024-07-20T09:05:00Z", text: "Initial RFP"}] },
                    { id: "d2", name: "Floor Plan Rev B.dwg", added: "2024-07-22T14:00:00Z", addedBy: "DesignBuild Arch.", labels: ["Design", "CAD"], comments: [] },
                ],
                tasks: [
                    { id: "t1", type: "task", description: "Submit Initial Proposal", assignee: "p2", interested: ["p3"], dueDate: "2024-08-15", completed: false, labels: ["Proposal", "Urgent"], comments: [] },
                    { id: "t2", type: "checklist", title: "Site Walk Checklist", assignee: "p1", interested: [], dueDate: null, completed: false, labels: ["Site", "Critical"], items: [{ text: "Verify access", completed: true }, { text: "Check power availability", completed: false }], comments: [{by: "Alice Martin", time: "2024-07-29T11:00:00Z", text: "Access verified."}] }
                ],
                activityLog: [
                    { time: "2024-07-29T11:00:00Z", user: "Alice Martin", action: "Added comment to task 'Site Walk Checklist'", phase: "Response" },
                    { time: "2024-07-28T10:30:00Z", user: "Alice Martin", action: "Updated deadline for task 'Submit Initial Proposal'", phase: "Response" },
                    { time: "2024-07-22T14:00:00Z", user: "DesignBuild Arch.", action: "Uploaded document 'Floor Plan Rev B.dwg'", phase: "Response" },
                    { time: "2024-07-20T09:00:00Z", user: "Alice Martin", action: "Created Journey 'Downtown Office Fit-out'", phase: "Scope" },
                ],
                commentHistory: [ // Centralized history should match item comments for consistency
                     { time: "2024-07-29T11:00:00Z", user: "Alice Martin", text: "Access verified.", phase: "Response", context: { type: 'task', id: 't2'} },
                     { time: "2024-07-28T10:35:00Z", user: "Alice Martin", text: "@ConstructCo Rep Please ensure the proposal includes alternate material options.", phase: "Response", context: { type: 'task', id: 't1'} },
                     { time: "2024-07-22T14:05:00Z", user: "DesignBuild Arch.", text: "Updated floor plan attached.", phase: "Response", context: { type: 'document', id: 'd2'} },
                     { time: "2024-07-20T09:05:00Z", user: "Alice Martin", text: "Initial RFP", phase: "Scope", context: { type: 'document', id: 'd1'} },
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
                phases: ["Scope", "Bid", "Review", "Interviews", "Negotiation", "Awarded", "Installation", "Commissioning", "Closeout"], // Custom phases
                participants: [
                    { id: "p1", name: "Alice Martin", role: "Owner", labels: ["Lead"] },
                    { id: "p5", name: "Bob Jones", role: "Owner", labels: ["Finance", "Approval"] },
                    { id: "p7", name: "MechPro Inc.", role: "Contractor", labels: ["HVAC", "Awarded"] } // New person needed
                ],
                documents: [
                    { id: "d3", name: "MechPro Final Proposal.pdf", added: "2024-07-15T11:00:00Z", addedBy: "MechPro Inc.", labels: ["Proposal", "Awarded"], comments: [] },
                    { id: "d4", name: "Signed Contract - HVAC.pdf", added: "2024-07-25T15:55:00Z", addedBy: "Bob Jones", labels: ["Contract", "Legal", "Executed"], comments: [{by:"Bob Jones", time:"2024-07-25T15:56:00Z", text:"Contract executed."}] }
                ],
                tasks: [
                     { id: "t3", type: "task", description: "Issue Notice to Proceed", assignee: "p1", interested: ["p5", "p7"], dueDate: "2024-08-01", completed: false, labels: ["Contract", "Admin"], comments: [{by:"Bob Jones", time:"2024-07-25T16:01:00Z", text:"@Alice Martin Please issue the NTP."}] },
                     { id: "t4", type: "task", description: "Submit Insurance Certificates", assignee: "p7", interested: ["p1"], dueDate: "2024-08-10", completed: false, labels: ["Compliance", "Insurance"], comments: [] }
                ],
                activityLog: [
                     { time: "2024-07-25T16:01:00Z", user: "Bob Jones", action: "Added comment to task 'Issue Notice to Proceed'", phase: "Awarded" },
                     { time: "2024-07-25T16:00:00Z", user: "Bob Jones", action: "Marked Journey as Awarded", phase: "Awarded" },
                     { time: "2024-07-25T15:56:00Z", user: "Bob Jones", action: "Added comment to document 'Signed Contract - HVAC.pdf'", phase: "Awarded" },
                     { time: "2024-07-25T15:55:00Z", user: "Bob Jones", action: "Uploaded document 'Signed Contract - HVAC.pdf'", phase: "Awarded" },
                     { time: "2024-07-15T11:00:00Z", user: "MechPro Inc.", action: "Uploaded document 'MechPro Final Proposal.pdf'", phase: "Negotiation" },
                ],
                commentHistory: [
                     { time: "2024-07-25T16:01:00Z", user: "Bob Jones", text: "@Alice Martin Please issue the NTP.", phase: "Awarded", context: { type: 'task', id: 't3'} },
                     { time: "2024-07-25T15:56:00Z", user: "Bob Jones", text: "Contract executed.", phase: "Awarded", context: { type: 'document', id: 'd4'} },
                ]
            }
        },
        people: { // Global people directory
            "p1": { id: "p1", name: "Alice Martin", title: "Project Manager", company: "eConverge", image: "", labels: ["Lead", "Internal"] },
            "p2": { id: "p2", name: "ConstructCo Rep", title: "Lead Estimator", company: "ConstructCo LLC", image: "", labels: ["GC", "External", "Primary"] },
            "p3": { id: "p3", name: "DesignBuild Arch.", title: "Senior Architect", company: "DesignBuild Inc.", image: "", labels: ["Architect", "External"] },
            "p4": { id: "p4", name: "TechCorp Fac.", title: "Facilities Lead", company: "TechCorp", image: "", labels: ["Tenant", "Key Contact"] },
            "p5": { id: "p5", name: "Bob Jones", title: "Procurement Officer", company: "eConverge", image: "", labels: ["Finance", "Internal"] },
            "p6": { id: "p6", name: "Supplier X", title: "Sales Rep", company: "Materials Inc.", image: "", labels: ["Supplier", "External"] },
            "p7": { id: "p7", name: "MechPro Inc.", title: "Project Manager", company: "MechPro Inc.", image: "", labels: ["HVAC", "External", "Contractor"] } // Added for j2
        },
        contracts: {
            "c1": { id: "c1", contractWith: "ConstructCo LLC", summary: "Master Services Agreement", startDate: "2023-01-01", endDate: "2025-12-31", files: ["MSA_ConstructCo.pdf"] },
            "c2": { id: "c2", contractWith: "DesignBuild Inc.", summary: "Standard Design Contract", startDate: "2022-06-01", endDate: "", files: ["DesignBuild_Contract.pdf", "Amendment1.pdf"] },
            "c3": { id: "c3", contractWith: "MechPro Inc.", summary: "HVAC Upgrade Contract", startDate: "2024-07-25", endDate: "2025-01-31", files: ["Signed Contract - HVAC.pdf"] } // Added for j2
        }
    };

    // --- DOM Element References ---
    const headerTitle = document.getElementById('header-title');
    const headerActionButton = document.getElementById('header-action-button');
    const views = {
        'journey-overview': document.getElementById('journey-overview-view'),
        'journey-detail': document.getElementById('journey-detail-view'),
        'people': document.getElementById('people-view'),
        'contracts': document.getElementById('contracts-view'),
    };
    const navItems = {
        'journeys': document.getElementById('nav-journeys'),
        'people': document.getElementById('nav-people'),
        'contracts': document.getElementById('nav-contracts'),
    };
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
    const addDocumentBtn = document.getElementById('add-document-btn');
    const documentsList = document.getElementById('documents-list');
    const addTaskBtn = document.getElementById('add-task-btn');
    const tasksList = document.getElementById('tasks-list');
    const commentHistoryList = document.getElementById('comment-history-list');
    const activityLogList = document.getElementById('activity-log-list');
    const peopleListTbody = document.getElementById('people-list-tbody');
    const contractsListTbody = document.getElementById('contracts-list-tbody');
    const addPersonButton = document.getElementById('add-person-button');
    const addContractButton = document.getElementById('add-contract-button');

    // Modals
    const journeyDetailsModal = document.getElementById('journey-details-modal');
    const editPhasesModal = document.getElementById('edit-phases-modal');
    const participantModal = document.getElementById('participant-modal');
    const documentModal = document.getElementById('document-modal');
    const taskModal = document.getElementById('task-modal');
    const personModal = document.getElementById('person-modal');
    const contractModal = document.getElementById('contract-modal');

    // --- Utility Functions ---
    const showView = (viewId) => {
        Object.values(views).forEach(v => v.classList.add('hidden'));
        if (views[viewId]) {
            views[viewId].classList.remove('hidden');
            currentView = viewId.replace('-view', ''); // e.g., journey-overview
            updateHeader();
            updateNav();
        } else {
            console.error("View not found:", viewId);
            views['journey-overview'].classList.remove('hidden'); // Default fallback
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
                // Title set in loadJourneyDetail
                const journeyName = activeJourneyId ? (db.journeys[activeJourneyId]?.name || 'Journey Detail') : 'Journey Detail';
                headerTitle.textContent = `Journey: ${journeyName}`;
                headerActionButton.classList.add('hidden'); // Actions are inside the view
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
            default:
                headerTitle.textContent = 'eConverge Procurement';
                headerActionButton.classList.add('hidden');
        }
    };

     const updateNav = () => {
        Object.values(navItems).forEach(item => item.classList.remove('active'));
        const activeNavId = currentView.startsWith('journey') ? 'journeys' : currentView;
        if (navItems[activeNavId]) {
            navItems[activeNavId].classList.add('active');
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
            // Browsers might interpret YYYY-MM-DD as UTC, add time to ensure local
            const date = new Date(dateString + 'T00:00:00');
            return date.toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });
        } catch (e) {
            return dateString; // Return original if parsing fails
        }
    };

    const formatDateTime = (dateString) => {
        if (!dateString) return 'N/A';
         try {
            const date = new Date(dateString);
            return date.toLocaleString('en-US', { year: 'numeric', month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' });
        } catch (e) {
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
        } catch(e) {
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
        // Re-render activity log if view is active
        if (activeJourneyId === journeyId && currentView === 'journey-detail') {
             renderActivityLog(journey.activityLog);
        }
         // Also update overview table if visible
         if (currentView === 'journey-overview') {
            renderJourneyOverview();
         }
    };

     const addComment = (journeyId, context, text) => {
        if (!journeyId || !db.journeys[journeyId] || !text.trim()) {
            console.error("addComment: Invalid input", { journeyId, context, text });
            return false; // Indicate failure or no action
        }
        const journey = db.journeys[journeyId];
        if (!journey.commentHistory) journey.commentHistory = [];

        const newComment = {
            time: new Date().toISOString(),
            user: currentUser.name,
            text: text.trim(),
            phase: (journey.phases || defaultPhases)[journey.phaseIndex] || 'N/A',
            context: context // e.g., { type: 'document', id: 'd1' } or { type: 'task', id: 't1' } or { type: 'journey' }
        };

        // --- Add to central history ---
        journey.commentHistory.unshift(newComment);
        console.log(`Added to central commentHistory for ${journeyId}. New length: ${journey.commentHistory.length}`);

        // Also add to specific item's comment list if applicable
        let itemUpdated = false;
        try { // Add try...catch for safety when accessing nested data
            if (context.type === 'document' && context.id) {
                const doc = (journey.documents || []).find(d => d.id === context.id);
                if (doc) {
                    if (!doc.comments) doc.comments = [];
                    // Add to item's list (oldest first in modal, so push here)
                    doc.comments.push({ by: currentUser.name, time: newComment.time, text: newComment.text });
                    itemUpdated = true;
                }
            } else if (context.type === 'task' && context.id) {
                const task = (journey.tasks || []).find(t => t.id === context.id);
                if (task) {
                    if (!task.comments) task.comments = [];
                     // Add to item's list (oldest first in modal, so push here)
                    task.comments.push({ by: currentUser.name, time: newComment.time, text: newComment.text });
                    itemUpdated = true;
                }
            }
        } catch (error) {
            console.error("Error updating item's comment list:", error);
        }

        // Log the activity
        logActivity(journeyId, `Added comment: "${text.substring(0, 50)}..."`);

        // Re-render the main comment history feed if we're still in this journey detail view
        if (activeJourneyId === journeyId && currentView === 'journey-detail') {
            console.log(`Rendering main comment history for ${journeyId}`);
            renderCommentHistory(db.journeys[journeyId].commentHistory);
        } else {
            console.log(`Comment added for ${journeyId}, but view not active. View: ${currentView}, Active Journey: ${activeJourneyId}`);
        }

        return itemUpdated; // Indicate if the specific item's comment list was updated
    };


    const parseLabels = (labelString) => {
        if (!labelString) return [];
        return labelString.split(',')
                          .map(l => l.trim())
                          .filter(l => l) // Remove empty strings
                          .filter((value, index, self) => self.indexOf(value) === index); // Unique labels
    };

    const formatLabels = (labelsArray) => {
        if (!labelsArray || labelsArray.length === 0) return '';
        return labelsArray.map(l => `<span class="label-badge">${l}</span>`).join(' ');
    };

    // --- Rendering Functions ---

    // Journey Overview
    const renderJourneyOverview = () => {
        journeyListTbody.innerHTML = '';
        const journeys = Object.values(db.journeys);
        if (journeys.length === 0) {
             journeyListTbody.innerHTML = `<tr><td colspan="10" class="text-placeholder">No journeys found. Click 'New Journey' to create one.</td></tr>`;
             return;
        }
        journeys.sort((a, b) => new Date(b.lastUpdate || 0) - new Date(a.lastUpdate || 0)); // Sort by most recent update

        journeys.forEach(j => {
            const tr = document.createElement('tr');
            tr.dataset.journeyId = j.id;
            tr.classList.add('cursor-pointer');
            const phaseName = (j.phases || defaultPhases)[j.phaseIndex] || 'N/A';
            const status = j.customStatus || j.status || phaseName;
            const statusClass = status.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '');

            // Derive contractors/tenants from participants for display
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
    };

    // --- START LABEL FILTER FUNCTIONS ---
    function getAvailableLabelsForJourney(journeyId) {
        const journey = db.journeys[journeyId];
        if (!journey) return [];

        const allLabels = new Set(); // Use a Set for automatic uniqueness

        (journey.participants || []).forEach(p => (p.labels || []).forEach(l => allLabels.add(l)));
        (journey.documents || []).forEach(d => (d.labels || []).forEach(l => allLabels.add(l)));
        (journey.tasks || []).forEach(t => (t.labels || []).forEach(l => allLabels.add(l)));

        return Array.from(allLabels).sort(); // Return sorted array
    }

    function renderAvailableLabels(availableLabels) {
        const container = document.getElementById('available-labels-container');
        const clearButton = document.getElementById('clear-label-filters-btn');
        container.innerHTML = ''; // Clear previous

        if (!availableLabels || availableLabels.length === 0) {
            container.innerHTML = '<span class="text-muted" style="font-size: 12px;">No labels found in this journey.</span>';
            clearButton.style.display = 'none';
            return;
        }

        availableLabels.forEach(label => {
            const badge = document.createElement('span');
            badge.className = 'label-badge';
            badge.textContent = label;
            badge.dataset.label = label; // Store label in data attribute
            if (activeFilterLabels.includes(label)) {
                badge.classList.add('active-filter'); // Mark as active if in current filter
            }
            badge.addEventListener('click', handleLabelFilterClick); // Add click listener
            container.appendChild(badge);
        });

        // Show/hide clear button
        clearButton.style.display = activeFilterLabels.length > 0 ? 'inline-block' : 'none';
    }

    function handleLabelFilterClick(event) {
        const clickedLabel = event.target.dataset.label;
        if (!clickedLabel) return;

        // Toggle the label in the active filter list
        const index = activeFilterLabels.indexOf(clickedLabel);
        if (index > -1) {
            activeFilterLabels.splice(index, 1); // Remove if exists
            event.target.classList.remove('active-filter');
        } else {
            activeFilterLabels.push(clickedLabel); // Add if doesn't exist
            event.target.classList.add('active-filter');
        }

        // Update clear button visibility
         document.getElementById('clear-label-filters-btn').style.display = activeFilterLabels.length > 0 ? 'inline-block' : 'none';


        // Re-apply filters and re-render lists
        applyFiltersAndRerender();
    }

    function handleClearLabelFilters() {
        activeFilterLabels = []; // Clear the active filter array
        // Remove active class from all badges
        document.querySelectorAll('#available-labels-container .label-badge').forEach(badge => {
            badge.classList.remove('active-filter');
        });
         document.getElementById('clear-label-filters-btn').style.display = 'none'; // Hide button
        applyFiltersAndRerender(); // Re-render lists with no filters
    }

function applyFiltersAndRerender() {
    if (currentView !== 'journey-detail' || !activeJourneyId || !db.journeys[activeJourneyId]) {
        return; // Only apply if in the correct view with data
    }
    console.log("Applying filters:", activeFilterLabels);
    const journey = db.journeys[activeJourneyId];
    renderDocuments(journey.documents || []);
    renderTasks(journey.tasks || []);
    renderParticipants(journey.participants || []);
}
// --- END LABEL FILTER FUNCTIONS ---


// Journey Detail
const loadJourneyDetail = (journeyId) => {
    const journey = db.journeys[journeyId];
    if (!journey) {
        console.error("Journey not found:", journeyId);
        alert("Error: Could not load journey.");
        showView('journey-overview');
        return;
    }
    activeJourneyId = journeyId;
    // Determine if it's a newly created one (minimal data) vs existing
    isNewJourney = !journey.lastUpdate || (journey.activityLog && journey.activityLog.length <= 1);

    // Populate Header & Basic Info
    headerTitle.textContent = `Journey: ${journey.name}`; // Update header title
    journeyDetailTitle.textContent = journey.name;

    if (isNewJourney) {
        journeyStateText.textContent = "Creating New Journey";
        journeySaveButton.innerHTML = '<i class="fa-solid fa-check"></i> Save and Create';
    } else {
        journeyStateText.textContent = "Adding to Journey";
        journeySaveButton.innerHTML = '<i class="fa-solid fa-lock"></i> Lock In Changes';
    }
    journeySaveButton.onclick = handleSaveChanges; // General save handler


    // --- Render Available Labels ---
    activeFilterLabels = []; // Reset filters when loading a new journey
    const availableLabels = getAvailableLabelsForJourney(journeyId);
    renderAvailableLabels(availableLabels);
    // Add listener for the clear button
    const clearButton = document.getElementById('clear-label-filters-btn');
    clearButton.removeEventListener('click', handleClearLabelFilters); // Remove old listener
    clearButton.addEventListener('click', handleClearLabelFilters);
    // --- End Render Available Labels ---


    // Render initial content (which will now apply the empty filter via applyFiltersAndRerender)
    renderJourneyStatus(journey);
    renderJourneyPhases(journey.phases || defaultPhases, journey.phaseIndex);
    advancePhaseBtn.disabled = journey.phaseIndex >= (journey.phases || defaultPhases).length - 1;

    // Show the journey detail view (sets currentView) before rendering lists
    showView('journey-detail');

    // Apply current filters and render documents, tasks, and participants
    applyFiltersAndRerender();

    // Render comment history and activity log
    renderCommentHistory(journey.commentHistory || []);
    renderActivityLog(journey.activityLog || []);
};

 const renderJourneyStatus = (journey) => {
    journeyStatusSelect.innerHTML = '';
    // Combine default, current standard, and current custom status for options
    const currentStandardStatus = journey.status || (journey.phases ? journey.phases[journey.phaseIndex] : defaultPhases[journey.phaseIndex]);
    let allStatuses = [...defaultStatuses];
    if (currentStandardStatus && !allStatuses.includes(currentStandardStatus)) {
        allStatuses.push(currentStandardStatus);
    }
     if (journey.customStatus && !allStatuses.includes(journey.customStatus)) {
        allStatuses.push(journey.customStatus);
    }
    allStatuses = [...new Set(allStatuses)]; // Ensure unique

    allStatuses.forEach(s => {
        const option = document.createElement('option');
        option.value = s;
        option.textContent = s;
        journeyStatusSelect.appendChild(option);
    });

    const currentEffectiveStatus = journey.customStatus || currentStandardStatus;
    journeyStatusSelect.value = currentEffectiveStatus;

    const optionOther = document.createElement('option');
    optionOther.value = '__custom__';
    optionOther.textContent = 'Enter Custom Status...';
    journeyStatusSelect.appendChild(optionOther);

    journeyStatusCustom.classList.add('hidden');
    journeyStatusCustom.value = journey.customStatus || ''; // Show custom value if editing
};

const renderJourneyPhases = (phases, activeIndex) => {
    journeyPhasesDisplay.innerHTML = '';
     if (!phases || phases.length === 0) {
         journeyPhasesDisplay.innerHTML = '<p class="text-placeholder">No phases defined.</p>';
         return;
     }
    phases.forEach((phaseName, index) => {
        const phaseDiv = document.createElement('div');
        phaseDiv.className = 'phase';
        if (index < activeIndex) phaseDiv.classList.add('completed');
        if (index === activeIndex) phaseDiv.classList.add('active');
        phaseDiv.innerHTML = `
            <div class="phase-dot"></div>
            <div class="phase-label">${phaseName}</div>
        `;
        journeyPhasesDisplay.appendChild(phaseDiv);
    });
};

// --- Updated renderParticipants with filter logic ---
const renderParticipants = (participants) => {
    const listElement = participantsList; // Use the correct global reference
    listElement.innerHTML = '';
    // const filterLabels = getTagsFromInput('filter-labels-input-container'); // OLD
    const filterLabels = activeFilterLabels; // NEW: Use global state

    const filteredParticipants = (participants || []).filter(p => {
         if (filterLabels.length === 0) return true; // No filter applied
         const itemLabels = p.labels || [];
         // Item must have ALL filter labels
         return filterLabels.every(filterLabel => itemLabels.includes(filterLabel));
    });


    if (!filteredParticipants || filteredParticipants.length === 0) {
         const message = filterLabels.length > 0 ? 'No participants match the current filter.' : 'No participants added yet.';
         listElement.innerHTML = `<p class="text-placeholder">${message}</p>`;
         return;
    }
    filteredParticipants.forEach((p) => { // Index here is the filtered index, use original index for actions
        const originalIndex = (participants || []).findIndex(orig => orig.id === p.id); // Find original index using ID
        const name = p.name || `Participant ${originalIndex + 1}`;
        const role = p.role || 'Unknown';
        const iconClass = role === 'Owner' ? 'fa-user-tie' : (role === 'Contractor' ? 'fa-user-hard-hat' : (role === 'Tenant' ? 'fa-building-user' : 'fa-user'));

        const div = document.createElement('div');
        div.className = 'participant-item';
        div.innerHTML = `
            <div class="participant-icon"><i class="fa-solid ${iconClass}"></i></div>
            <div class="participant-name">${name}</div>
            <div class="participant-role">${role}</div>
            <div class="participant-labels-display">${formatLabels(p.labels || [])}</div>
             <button class="btn btn-sm btn-outline-primary mt-1 edit-participant-btn" data-original-index="${originalIndex}" title="Edit Participant"><i class="fa-solid fa-pencil"></i></button>
             <button class="btn btn-sm btn-outline-danger mt-1 remove-participant-btn" data-original-index="${originalIndex}" title="Remove Participant"><i class="fa-solid fa-trash"></i></button>
        `; // Use original index for editing/removing
        listElement.appendChild(div);
    });
     // Add edit/remove listeners - IMPORTANT: Use original index stored in data-original-index
    listElement.querySelectorAll('.edit-participant-btn').forEach(btn => {
        btn.addEventListener('click', (e) => handleEditParticipantClick(parseInt(e.currentTarget.dataset.originalIndex)));
    });
     listElement.querySelectorAll('.remove-participant-btn').forEach(btn => {
        btn.addEventListener('click', (e) => handleRemoveParticipantClick(parseInt(e.currentTarget.dataset.originalIndex)));
    });
};

// --- Updated renderDocuments with filter logic ---
const renderDocuments = (documents) => {
    const listElement = documentsList; // Use the correct global reference
    listElement.innerHTML = '';
    // const filterLabels = getTagsFromInput('filter-labels-input-container'); // OLD
    const filterLabels = activeFilterLabels; // NEW: Use global state

    const filteredDocuments = (documents || []).filter(doc => {
        if (filterLabels.length === 0) return true; // No filter applied
        const itemLabels = doc.labels || [];
        // Item must have ALL filter labels
        return filterLabels.every(filterLabel => itemLabels.includes(filterLabel));
    });

    if (!filteredDocuments || filteredDocuments.length === 0) {
        const message = filterLabels.length > 0 ? 'No documents match the current filter.' : 'No documents added yet.';
        listElement.innerHTML = `<p class="text-placeholder">${message}</p>`;
        return;
    }
    // Sort documents by added date, newest first
    filteredDocuments.sort((a, b) => new Date(b.added || 0) - new Date(a.added || 0));

    filteredDocuments.forEach(doc => {
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
        listElement.appendChild(div);
    });
};

// --- Updated renderTasks with filter logic ---
const renderTasks = (tasks) => {
    const listElement = tasksList; // Use the correct global reference
    listElement.innerHTML = '';
    // const filterLabels = getTagsFromInput('filter-labels-input-container'); // OLD
    const filterLabels = activeFilterLabels; // NEW: Use global state

    const filteredTasks = (tasks || []).filter(task => {
         if (filterLabels.length === 0) return true; // No filter applied
         const itemLabels = task.labels || [];
         // Item must have ALL filter labels
         return filterLabels.every(filterLabel => itemLabels.includes(filterLabel));
    });

    if (!filteredTasks || filteredTasks.length === 0) {
         const message = filterLabels.length > 0 ? 'No tasks match the current filter.' : 'No tasks added yet.';
         listElement.innerHTML = `<p class="text-placeholder">${message}</p>`;
         return;
    }
     // Optional: Sort tasks
     // filteredTasks.sort((a, b) => (a.completed - b.completed) || (new Date(a.dueDate || '9999') - new Date(b.dueDate || '9999')));

    filteredTasks.forEach((task) => {
        // Find the original index for data attributes if needed for checkbox interaction
        const originalTaskIndex = (tasks || []).findIndex(orig => orig.id === task.id);
        const div = document.createElement('div');
        div.className = 'task-item';
        div.dataset.taskId = task.id;
        div.style.opacity = task.completed ? 0.6 : 1;

        let content = '';
        const assigneeName = getParticipantName(task.assignee);
        const dueDateFormatted = task.dueDate ? `• Due: ${formatDate(task.dueDate)}` : '';
        const labelsFormatted = formatLabels(task.labels || []); // Already filtered, but display labels

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
                    ${ (task.items || []).map((item, itemIndex) => `
                        <div class="checklist-item">
                            <span class="custom-checkbox ${item.completed ? 'checked' : ''}" data-task-index="${originalTaskIndex}" data-item-index="${itemIndex}"></span>
                            <span style="${item.completed ? 'text-decoration: line-through; color: #888;' : ''}">${item.text}</span>
                        </div>
                    `).join('') }
                </div>`;
        } else { // Single task
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
                </div>`;
        }
        div.innerHTML = content;
        div.addEventListener('click', (e) => {
            if (!e.target.classList.contains('custom-checkbox')) {
                handleEditTaskClick(task.id);
            }
        });
        listElement.appendChild(div);
    });
};


const renderCommentHistory = (comments) => {
    commentHistoryList.innerHTML = '';
     if (!comments || comments.length === 0) {
        commentHistoryList.innerHTML = '<p class="text-placeholder">No comments yet.</p>';
        return;
    }
     // Comments are already sorted newest first by unshift in addComment
    comments.forEach(comment => {
        const div = document.createElement('div');
        div.className = 'feed-item';
        // Basic context linking - could be improved with actual links
        let contextLink = '';
        let contextText = '';
        if (comment.context && activeJourneyId && db.journeys[activeJourneyId]) { // Check active journey
            const journey = db.journeys[activeJourneyId];
            if (journey) {
                if (comment.context.type === 'document') {
                    const doc = (journey.documents || []).find(d => d.id === comment.context.id);
                    contextText = doc ? `on document "${doc.name.substring(0, 20)}..."` : 'on a document';
                } else if (comment.context.type === 'task') {
                    const task = (journey.tasks || []).find(t => t.id === comment.context.id);
                    contextText = task ? `on task "${(task.description || task.title || '').substring(0, 20)}..."` : 'on a task';
                } else if (comment.context.type === 'journey') {
                    contextText = 'on the journey';
                }
                 if (contextText) {
                     contextLink = `<span class="text-muted" style="font-size: 11px;"> ${contextText}</span>`;
                 }
            }
        }

        div.innerHTML = `
            <div class="feed-dot"></div>
            <div class="feed-content">
                <div class="feed-meta"><strong>${comment.user}</strong> • ${timeAgo(comment.time)} <span class="feed-phase">(${comment.phase})</span></div>
                <div class="feed-text">${comment.text.replace(/@(\w+[\s\w]*)/g, '<strong>@$1</strong>')} ${contextLink}</div>
            </div>
        `;
        commentHistoryList.appendChild(div);
    });
};

const renderActivityLog = (log) => {
    activityLogList.innerHTML = '';
     if (!log || log.length === 0) {
        activityLogList.innerHTML = '<p class="text-placeholder">No activity yet.</p>';
        return;
    }
     // Log is already sorted newest first by unshift
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
};

// People View
const renderPeople = () => {
    peopleListTbody.innerHTML = '';
    const people = Object.values(db.people);
     if (people.length === 0) {
         peopleListTbody.innerHTML = `<tr><td colspan="6" class="text-placeholder">No people found. Click 'Add Person' to create one.</td></tr>`;
         return;
    }
    people.sort((a,b) => (a.name || '').localeCompare(b.name || '')); // Sort alphabetically

    people.forEach(p => {
        const tr = document.createElement('tr');
        tr.innerHTML = `
            <td><img src="${p.image || 'https://via.placeholder.com/30/CCCCCC/808080?text=?'}" alt="${p.name}" class="person-image"></td>
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
    // Add listeners for edit/delete
     peopleListTbody.querySelectorAll('.edit-person-btn').forEach(btn => btn.addEventListener('click', (e) => handleEditPersonClick(e.currentTarget.dataset.id)));
     peopleListTbody.querySelectorAll('.delete-person-btn').forEach(btn => btn.addEventListener('click', (e) => handleDeletePersonClick(e.currentTarget.dataset.id)));
};

// Contracts View
const renderContracts = () => {
    contractsListTbody.innerHTML = '';
    const contracts = Object.values(db.contracts);
     if (contracts.length === 0) {
         contractsListTbody.innerHTML = `<tr><td colspan="5" class="text-placeholder">No contracts found. Click 'Add Contract' to create one.</td></tr>`;
         return;
    }
     contracts.sort((a,b) => (a.contractWith || '').localeCompare(b.contractWith || '')); // Sort alphabetically

    contracts.forEach(c => {
        const tr = document.createElement('tr');
        tr.innerHTML = `
            <td>${c.contractWith || 'N/A'}</td>
            <td>${c.summary || 'N/A'}</td>
            <td>${formatDate(c.startDate)} - ${c.endDate ? formatDate(c.endDate) : 'Ongoing'}</td>
            <td>${(c.files || []).length} file(s)</td>
             <td>
                <button class="btn btn-sm btn-outline-primary edit-contract-btn" data-id="${c.id}" title="Edit Contract"><i class="fa-solid fa-pencil"></i></button>
                <button class="btn btn-sm btn-outline-danger delete-contract-btn" data-id="${c.id}" title="Delete Contract"><i class="fa-solid fa-trash"></i></button>
            </td>
        `;
        contractsListTbody.appendChild(tr);
    });
     // Add listeners for edit/delete
     contractsListTbody.querySelectorAll('.edit-contract-btn').forEach(btn => btn.addEventListener('click', (e) => handleEditContractClick(e.currentTarget.dataset.id)));
     contractsListTbody.querySelectorAll('.delete-contract-btn').forEach(btn => btn.addEventListener('click', (e) => handleDeleteContractClick(e.currentTarget.dataset.id)));
};


// --- Event Handlers ---

// Navigation
navItems.journeys.addEventListener('click', () => showView('journey-overview'));
navItems.people.addEventListener('click', () => { renderPeople(); showView('people'); });
navItems.contracts.addEventListener('click', () => { renderContracts(); showView('contracts'); });

// Journey Overview Actions
// --- Updated handleNewJourneyClick for Clean Start ---
const handleNewJourneyClick = () => {
    activeJourneyId = generateId('j');
    isNewJourney = true;
    const now = new Date().toISOString();
    const creatorName = currentUser.name;
    const creatorId = currentUser.id || generateId('p'); // Use current user ID or generate one

    // Ensure creator exists in people db if using ID
    if (!db.people[creatorId]) {
         db.people[creatorId] = { id: creatorId, name: creatorName, title: "Creator", company: "eConverge", image: "", labels: ["Internal"] };
         if (currentView === 'people') renderPeople(); // Update people view if active
    }

    // Create a truly minimal journey object
    db.journeys[activeJourneyId] = {
        id: activeJourneyId,
        name: "New Untitled Journey",
        contractors: [], // Start empty
        location: [],    // Start empty
        tenants: [],     // Start empty
        phaseIndex: 0,
        assignedTo: creatorId, // Assign to creator initially
        nextDeadline: null,
        status: defaultPhases[0], // Initial status based on phase 0
        lastUpdate: now,
        updatedBy: creatorName,
        description: "", // Start empty
        customStatus: null,
        phases: [...defaultPhases], // Copy default phases
        participants: [{ id: creatorId, name: creatorName, role: "Owner", labels: ["Creator"] }], // Add only creator
        documents: [],   // Start empty
        tasks: [],       // Start empty
        activityLog: [{ time: now, user: creatorName, action: "Created Journey 'New Untitled Journey'", phase: defaultPhases[0] }], // Initial log entry
        commentHistory: [] // Start empty
    };

    // Load the detail view for the new journey
    loadJourneyDetail(activeJourneyId);

    // Open the details modal immediately for a new journey
    handleJourneyDetailsClick();
};


// Journey Detail Actions
const handleSaveChanges = () => {
    if (!activeJourneyId || !db.journeys[activeJourneyId]) return;
    const journey = db.journeys[activeJourneyId];

    // Update status (if changed) - This is now handled by blur/change events mostly
    // But we ensure it's saved here too.
    const selectedStatus = journeyStatusSelect.value;
    if (selectedStatus === '__custom__') {
        const custom = journeyStatusCustom.value.trim();
        if (custom) {
            journey.customStatus = custom;
            journey.status = null; // Clear standard status if custom is set
        } else { // If custom is empty, revert to standard
            journey.customStatus = null;
            journey.status = (journey.phases || defaultPhases)[journey.phaseIndex];
        }
    } else {
        journey.customStatus = null;
        journey.status = selectedStatus;
    }

    // In a real app, this would send all changed data to the backend.
    // Here, we just update the log and potentially switch view.
    const actionText = isNewJourney ? `Saved new Journey '${journey.name}'` : `Saved changes to Journey '${journey.name}'`;
    logActivity(activeJourneyId, actionText);

    alert("Changes Locked In (Simulated Save)");
    isNewJourney = false; // No longer new after first save
    journeyStateText.textContent = "Adding to Journey";
    journeySaveButton.innerHTML = '<i class="fa-solid fa-lock"></i> Lock In Changes';

    renderJourneyOverview(); // Update the overview list
    loadJourneyDetail(activeJourneyId); // Refresh detail view with saved data
    // Or switch back to overview: showView('journey-overview');
};

journeyStatusSelect.addEventListener('change', (e) => {
     if (e.target.value === '__custom__') {
         journeyStatusCustom.classList.remove('hidden');
         journeyStatusCustom.value = db.journeys[activeJourneyId]?.customStatus || ''; // Pre-fill if exists
         journeyStatusCustom.focus();
     } else {
         journeyStatusCustom.classList.add('hidden');
         // Auto-save status change for simplicity in this demo
         if (activeJourneyId && db.journeys[activeJourneyId]) {
             db.journeys[activeJourneyId].status = e.target.value;
             db.journeys[activeJourneyId].customStatus = null;
             logActivity(activeJourneyId, `Status changed to ${e.target.value}`);
             // No need to re-render whole view, just log
         }
     }
});
 journeyStatusCustom.addEventListener('blur', (e) => { // Save custom on blur
      if (activeJourneyId && db.journeys[activeJourneyId]) {
          const customVal = e.target.value.trim();
          if (customVal) {
              db.journeys[activeJourneyId].customStatus = customVal;
              db.journeys[activeJourneyId].status = null; // Clear standard status
               logActivity(activeJourneyId, `Status changed to custom: ${customVal}`);
               renderJourneyStatus(db.journeys[activeJourneyId]); // Re-render dropdown to include the new custom status
          } else { // If cleared, revert to phase status
               journeyStatusCustom.classList.add('hidden');
               db.journeys[activeJourneyId].customStatus = null;
               db.journeys[activeJourneyId].status = (db.journeys[activeJourneyId].phases || defaultPhases)[db.journeys[activeJourneyId].phaseIndex];
               renderJourneyStatus(db.journeys[activeJourneyId]); // Re-render dropdown
          }
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
addParticipantBtn.addEventListener('click', () => handleAddParticipantClick()); // No index means add new
addDocumentBtn.addEventListener('click', () => handleAddDocumentClick());
addTaskBtn.addEventListener('click', () => handleAddTaskClick());

 // Task Checkbox Interaction
tasksList.addEventListener('click', (event) => {
    const checkbox = event.target.closest('.custom-checkbox');
    if (checkbox) {
        const taskIndex = parseInt(checkbox.dataset.taskIndex); // This is the ORIGINAL index
        const itemIndex = checkbox.dataset.itemIndex !== undefined ? parseInt(checkbox.dataset.itemIndex) : null;
        const journey = db.journeys[activeJourneyId];

        // Find the task using the original index from the full task list
        if (journey && journey.tasks && journey.tasks[taskIndex]) {
            const task = journey.tasks[taskIndex];
            let completed = checkbox.classList.toggle('checked');
            let logText = "";

            if (task.type === 'checklist' && itemIndex !== null && task.items && task.items[itemIndex]) {
                task.items[itemIndex].completed = completed;
                logText = `Checklist item "${task.items[itemIndex].text}" marked as ${completed ? 'complete' : 'incomplete'} in task "${task.title}"`;
                // Re-render tasks applying current filters
                applyFiltersAndRerender();
            } else if (task.type === 'task') {
                task.completed = completed;
                 logText = `Task "${task.description}" marked as ${completed ? 'complete' : 'incomplete'}`;
                 // Re-render tasks applying current filters
                 applyFiltersAndRerender();
            }

            if (logText) {
                logActivity(activeJourneyId, logText);
                // Activity log is rendered by logActivity if view is active
            }
        } else {
            console.error("Could not find task for checkbox interaction using index:", taskIndex);
        }
    }
});

// --- Modal Handlers ---

// Journey Details Modal
function handleJourneyDetailsClick() {
    if (!activeJourneyId || !db.journeys[activeJourneyId]) return;
    const journey = db.journeys[activeJourneyId];
    document.getElementById('modal-journey-name').value = journey.name || '';
    document.getElementById('modal-journey-description').value = journey.description || '';
    // Use derived contractors/tenants for initial display if needed, but save directly
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
    // Save directly to these fields now, overview table will derive from participants if needed
    journey.contractors = getTagsFromInput('modal-journey-contractors');
    journey.location = getTagsFromInput('modal-journey-location');
    journey.tenants = getTagsFromInput('modal-journey-tenants');

    if (journey.name !== oldName) {
         logActivity(activeJourneyId, `Journey name changed from "${oldName}" to "${journey.name}"`);
         headerTitle.textContent = `Journey: ${journey.name}`; // Update header
    } else {
         logActivity(activeJourneyId, `Journey details updated`);
    }

    journeyDetailTitle.textContent = journey.name; // Update title in main view
    renderJourneyOverview(); // Update overview list as details might affect it
    hideModal(journeyDetailsModal);
});

// Edit Phases Modal
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
     // Add delete listeners
    list.querySelectorAll('.delete-phase-btn').forEach(btn => {
        btn.addEventListener('click', (e) => {
             const currentPhaseIndex = db.journeys[activeJourneyId]?.phaseIndex;
             const indexToDelete = parseInt(e.currentTarget.dataset.index);
             if (indexToDelete === currentPhaseIndex) {
                 alert("Cannot delete the currently active phase.");
                 return;
             }
             e.currentTarget.closest('li').remove();
             // Actual deletion logic happens on save
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
         li.innerHTML = `<span>${name}</span> <button class="btn btn-sm btn-outline-danger delete-phase-btn" title="Delete Phase"><i class="fa-solid fa-trash-alt"></i></button>`; // No index needed yet
         list.appendChild(li);
         input.value = '';
         // Re-add listener to new button
          li.querySelector('.delete-phase-btn').addEventListener('click', (e) => {
              // Cannot delete the active phase - this button is only for newly added ones before save
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
     // Ensure current phase index is still valid after potential deletions
     // Find the name of the current phase before updating the list
     const currentPhaseName = (journey.phases || defaultPhases)[journey.phaseIndex];
     const newIndex = newPhases.indexOf(currentPhaseName);

     journey.phases = newPhases;
     // If the old phase name still exists, update index, otherwise reset to 0 (or handle differently)
     journey.phaseIndex = (newIndex !== -1) ? newIndex : 0;

    logActivity(activeJourneyId, "Journey phases updated");
    renderJourneyPhases(journey.phases, journey.phaseIndex);
    advancePhaseBtn.disabled = journey.phaseIndex >= journey.phases.length - 1; // Update button state
    hideModal(editPhasesModal);
});

 function handleAdvancePhaseClick() {
     if (!activeJourneyId || !db.journeys[activeJourneyId]) return;
     const journey = db.journeys[activeJourneyId];
     const currentPhaseList = journey.phases || defaultPhases;
     if (journey.phaseIndex < currentPhaseList.length - 1) {
         journey.phaseIndex++;
         // Update status to match new phase name (default behavior)
         journey.status = currentPhaseList[journey.phaseIndex];
         journey.customStatus = null; // Clear custom status on phase advance
         logActivity(activeJourneyId, `Advanced to phase: ${journey.status}`);
         renderJourneyPhases(currentPhaseList, journey.phaseIndex);
         renderJourneyStatus(journey); // Update status dropdown
         advancePhaseBtn.disabled = journey.phaseIndex >= currentPhaseList.length - 1;
         renderJourneyOverview(); // Update overview list as phase changed
     }
 }

// Participant Modal
function handleAddParticipantClick() {
    document.getElementById('participant-modal-title').textContent = "Add Participant";
    document.getElementById('edit-participant-index').value = ""; // Clear edit index
    document.getElementById('participant-name').value = "";
    document.getElementById('participant-role').value = "Contractor";
    document.getElementById('participant-labels').value = "";
    document.getElementById('participant-search').value = "";
    document.getElementById('participant-picklist').innerHTML = "";
    document.getElementById('participant-picklist').style.display = 'none';
    showModal(participantModal);
}
// Updated handler to use originalIndex
 function handleEditParticipantClick(originalIndex) {
     if (!activeJourneyId || !db.journeys[activeJourneyId] || !db.journeys[activeJourneyId].participants || db.journeys[activeJourneyId].participants.length <= originalIndex) return;
     const participant = db.journeys[activeJourneyId].participants[originalIndex];
     document.getElementById('participant-modal-title').textContent = "Edit Participant";
     document.getElementById('edit-participant-index').value = originalIndex; // Use the original index
     document.getElementById('participant-name').value = participant.name || "";
     document.getElementById('participant-role').value = participant.role || "Contractor";
     document.getElementById('participant-labels').value = (participant.labels || []).join(', ');
     document.getElementById('participant-search').value = "";
     document.getElementById('participant-picklist').innerHTML = "";
     document.getElementById('participant-picklist').style.display = 'none';
     showModal(participantModal);
}
// Updated handler to use originalIndex
 function handleRemoveParticipantClick(originalIndex) {
     if (!activeJourneyId || !db.journeys[activeJourneyId] || !db.journeys[activeJourneyId].participants || db.journeys[activeJourneyId].participants.length <= originalIndex) return;
     const journey = db.journeys[activeJourneyId];
     const participant = journey.participants[originalIndex];
     if (confirm(`Are you sure you want to remove participant "${participant.name}" from this journey?`)) {
         const removedName = participant.name;
         journey.participants.splice(originalIndex, 1); // Use original index to remove
         logActivity(activeJourneyId, `Removed participant: ${removedName}`);
         // Re-render participants applying current filters
         applyFiltersAndRerender(); // This will call renderParticipants
         renderJourneyOverview(); // Update overview as contractors/tenants might change
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
        .filter(p => !journeyParticipantIds.includes(p.id)) // Exclude people already in the journey
        .filter(p => p.name.toLowerCase().includes(searchTerm) || (p.company || '').toLowerCase().includes(searchTerm))
        .slice(0, 10) // Limit results
        .forEach(p => {
            const div = document.createElement('div');
            div.className = 'list-group-item list-group-item-action cursor-pointer';
            div.innerHTML = `<strong>${p.name}</strong> <small>(${p.company || 'N/A'})</small>`;
            div.onclick = () => {
                document.getElementById('participant-name').value = p.name;
                // Attempt to guess role based on labels or title? Simple approach: leave default
                document.getElementById('participant-labels').value = (p.labels || []).join(', ');
                // We need to store the selected person's ID to link them properly
                document.getElementById('participant-name').dataset.selectedPersonId = p.id; // Store ID temporarily
                picklist.innerHTML = ''; // Clear after selection
                picklist.style.display = 'none';
            };
            picklist.appendChild(div);
        });
     if (picklist.children.length > 0) {
         picklist.style.display = 'block';
     }
});
 // Hide picklist on blur if nothing selected
 document.getElementById('participant-search').addEventListener('blur', (e) => {
     // Timeout allows click event on picklist item to register first
     setTimeout(() => {
         if (!participantModal.contains(document.activeElement)) { // Check if focus moved outside modal
            document.getElementById('participant-picklist').style.display = 'none';
         }
     }, 200);
 });


// Updated save handler to use originalIndex
document.getElementById('save-participant-btn').addEventListener('click', () => {
    if (!activeJourneyId || !db.journeys[activeJourneyId]) return;
    const journey = db.journeys[activeJourneyId];
    const nameInput = document.getElementById('participant-name');
    const name = nameInput.value.trim();
    const role = document.getElementById('participant-role').value;
    const labels = parseLabels(document.getElementById('participant-labels').value);
    const editIndexStr = document.getElementById('edit-participant-index').value; // Get the index string
    const selectedPersonId = nameInput.dataset.selectedPersonId; // Get stored ID if selected from picklist

    if (!name || !role) {
        alert("Participant name and role are required.");
        return;
    }

    // Use selected person ID if available, otherwise generate new ID
    const participantId = selectedPersonId || generateId('p');

    const participantData = {
        id: participantId,
        name: name,
        role: role,
        labels: labels
    };

    // Clear the temporary selected ID
    delete nameInput.dataset.selectedPersonId;

    if (editIndexStr !== "") { // Editing existing
        const index = parseInt(editIndexStr); // Parse the original index
        if (index >= 0 && journey.participants && index < journey.participants.length) { // Check if index is valid
            journey.participants[index] = { ...journey.participants[index], ...participantData }; // Merge data, keeping original ID
            logActivity(activeJourneyId, `Updated participant: ${name}`);
        } else {
            console.error("Invalid index for editing participant:", index);
            alert("Error updating participant.");
            return; // Stop if index is bad
        }
    } else { // Adding new
         // Check if this person (by ID) is already in the journey
         if ((journey.participants || []).some(p => p.id === participantId)) {
             alert(`"${name}" is already a participant in this journey.`);
             return;
         }
        if (!journey.participants) journey.participants = [];
        journey.participants.push(participantData);
        logActivity(activeJourneyId, `Added participant: ${name} (${role})`);
    }

    // Re-render participants applying current filters
    applyFiltersAndRerender(); // This will call renderParticipants
    renderJourneyOverview(); // Update overview as contractors/tenants might change
    hideModal(participantModal);
});


// Document Modal
function handleAddDocumentClick() {
    document.getElementById('document-modal-title').textContent = "Add Document";
    document.getElementById('edit-document-id').value = "";
    document.getElementById('document-name').value = "";
    document.getElementById('document-file').value = ""; // Clear file input
    document.getElementById('document-labels').value = "";
    renderModalComments('document-comments-list', []); // Clear comments
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
     document.getElementById('document-file').value = ""; // Cannot prefill file input
     document.getElementById('document-labels').value = (doc.labels || []).join(', ');
     renderModalComments('document-comments-list', doc.comments || []);
     document.getElementById('document-new-comment').value = "";
     showModal(documentModal);
 }

document.getElementById('save-document-btn').addEventListener('click', () => {
     if (!activeJourneyId || !db.journeys[activeJourneyId]) return;
     const journey = db.journeys[activeJourneyId];
     const name = document.getElementById('document-name').value.trim();
     const fileInput = document.getElementById('document-file');
     const labels = parseLabels(document.getElementById('document-labels').value);
     const editId = document.getElementById('edit-document-id').value;

     if (!name) {
         alert("Document name is required.");
         return;
     }
     // In a real app, handle file upload here. We'll just use the name.
     const fileName = fileInput.files.length > 0 ? fileInput.files[0].name : (editId ? (journey.documents || []).find(d=>d.id===editId)?.name : name);

     if (editId) { // Editing
         const docIndex = (journey.documents || []).findIndex(d => d.id === editId);
         if (docIndex > -1) {
             journey.documents[docIndex].name = name;
             journey.documents[docIndex].labels = labels;
             // Don't update added date/by on edit unless file changes
             logActivity(activeJourneyId, `Updated document: ${name}`);
         }
     } else { // Adding
         const newDoc = {
             id: generateId('d'),
             name: name,
             added: new Date().toISOString(),
             addedBy: currentUser.name,
             labels: labels,
             comments: [] // Start with empty comments
         };
         if (!journey.documents) journey.documents = [];
         journey.documents.push(newDoc);
         logActivity(activeJourneyId, `Added document: ${name}`);
     }
     // Re-render documents applying current filters
     applyFiltersAndRerender(); // This calls renderDocuments
     hideModal(documentModal);
});

document.getElementById('add-document-comment-btn').addEventListener('click', () => {
     const text = document.getElementById('document-new-comment').value;
     const docId = document.getElementById('edit-document-id').value;
     if (text && docId && activeJourneyId) {
         const itemUpdated = addComment(activeJourneyId, { type: 'document', id: docId }, text);
         if (itemUpdated) {
             const doc = db.journeys[activeJourneyId].documents.find(d => d.id === docId);
             renderModalComments('document-comments-list', doc?.comments || []);
         }
         document.getElementById('document-new-comment').value = ''; // Clear input
     }
});

// Task Modal
function handleAddTaskClick() {
    document.getElementById('task-modal-title').textContent = "Add Task / Checklist";
    document.getElementById('edit-task-id').value = "";
    document.querySelector('input[name="task-type"][value="task"]').checked = true;
    toggleTaskTypeFields('task');
    document.getElementById('task-description').value = "";
    document.getElementById('checklist-title').value = "";
    document.getElementById('checklist-items-container').innerHTML = ''; // Clear items
    addChecklistItemInput(); // Add one blank item
    populateParticipantDropdown('task-assignee');
    populateParticipantDropdown('task-interested', true); // Allow multiple
    document.getElementById('task-due-date').value = "";
    document.getElementById('task-labels').value = "";
    renderModalComments('task-comments-list', []); // Clear comments
    document.getElementById('task-new-comment').value = "";
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
         (task.items || []).forEach(item => addChecklistItemInput(item.text));
         if (!task.items || task.items.length === 0) addChecklistItemInput(); // Add blank if empty
     }

     populateParticipantDropdown('task-assignee', false, task.assignee);
     populateParticipantDropdown('task-interested', true, task.interested || []); // Pass empty array if undefined
     document.getElementById('task-due-date').value = task.dueDate || "";
     document.getElementById('task-labels').value = (task.labels || []).join(', ');
     renderModalComments('task-comments-list', task.comments || []);
     document.getElementById('task-new-comment').value = "";
     showModal(taskModal);
}

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
        // Ensure at least one item input exists for checklist
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
         // Prevent removing the last item
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
     select.innerHTML = '<option value="">-- Select --</option>';
     if (!activeJourneyId || !db.journeys[activeJourneyId]?.participants) {
         // console.warn("Cannot populate participants: No active journey or participants found.");
         return; // Silently return if no participants
     }

     const participants = db.journeys[activeJourneyId].participants || [];
     // console.log(`Populating ${selectId} with:`, participants); // Debugging line

     participants.forEach(p => {
         const option = document.createElement('option');
         option.value = p.id; // Use participant ID from the journey participant list
         option.textContent = `${p.name} (${p.role})`;
         select.appendChild(option);
     });

     if (allowMultiple) {
         select.multiple = true;
         // Handle selecting multiple values
         if (selectedValue && Array.isArray(selectedValue)) {
             Array.from(select.options).forEach(opt => {
                 if (selectedValue.includes(opt.value)) {
                     opt.selected = true;
                 } else {
                     opt.selected = false; // Ensure others are deselected
                 }
             });
         } else {
              // Clear selection if selectedValue is not an array
              Array.from(select.options).forEach(opt => opt.selected = false);
         }
     } else {
         select.multiple = false;
         if (selectedValue) {
             select.value = selectedValue;
         } else {
             select.value = ""; // Default to "-- Select --" if no value provided
         }
     }
 }

 document.getElementById('save-task-btn').addEventListener('click', () => {
     if (!activeJourneyId || !db.journeys[activeJourneyId]) return;
     const journey = db.journeys[activeJourneyId];
     const type = document.querySelector('input[name="task-type"]:checked').value;
     const assignee = document.getElementById('task-assignee').value; // This is the participant ID
     const interested = Array.from(document.getElementById('task-interested').selectedOptions).map(opt => opt.value);
     const dueDate = document.getElementById('task-due-date').value || null;
     const labels = parseLabels(document.getElementById('task-labels').value);
     const editId = document.getElementById('edit-task-id').value;
     let taskData = { assignee, interested, dueDate, labels, type, comments: [] }; // Base data
     let logText = "";

     if (type === 'task') {
         taskData.description = document.getElementById('task-description').value.trim();
         if (!taskData.description) { alert("Task description is required."); return; }
         taskData.completed = false; // Default for new/edited task
         logText = `Task: ${taskData.description}`;
     } else { // Checklist
         taskData.title = document.getElementById('checklist-title').value.trim();
         if (!taskData.title) { alert("Checklist title is required."); return; }
         taskData.items = [];
         document.querySelectorAll('.checklist-item-input').forEach(input => {
             const text = input.value.trim();
             if (text) taskData.items.push({ text: text, completed: false });
         });
         if (taskData.items.length === 0) { alert("Checklist must have at least one item."); return; }
         taskData.completed = false; // Overall checklist status (maybe calculate later)
         logText = `Checklist: ${taskData.title}`;
     }

     if (editId) { // Editing
         const taskIndex = (journey.tasks || []).findIndex(t => t.id === editId);
         if (taskIndex > -1) {
             // Preserve existing comments and completion status if editing
             taskData.comments = journey.tasks[taskIndex].comments || [];
             if (type === 'task') {
                 taskData.completed = journey.tasks[taskIndex].completed;
             } else {
                 // Preserve completion status of existing checklist items if names match
                 const existingItems = journey.tasks[taskIndex].items || [];
                 taskData.items = taskData.items.map(newItem => {
                     const existingItem = existingItems.find(ei => ei.text === newItem.text);
                     return { ...newItem, completed: existingItem ? existingItem.completed : false };
                 });
             }
             journey.tasks[taskIndex] = { ...journey.tasks[taskIndex], ...taskData };
             logActivity(activeJourneyId, `Updated ${logText}`);
         }
     } else { // Adding
         taskData.id = generateId('t');
         if (!journey.tasks) journey.tasks = [];
         journey.tasks.push(taskData);
          logActivity(activeJourneyId, `Added ${logText}`);
     }

     // Re-render tasks applying current filters
     applyFiltersAndRerender(); // This calls renderTasks
     hideModal(taskModal);
 });

 document.getElementById('add-task-comment-btn').addEventListener('click', () => {
     const text = document.getElementById('task-new-comment').value;
     const taskId = document.getElementById('edit-task-id').value;
     if (text && taskId && activeJourneyId) {
         const itemUpdated = addComment(activeJourneyId, { type: 'task', id: taskId }, text);
         if (itemUpdated) {
             const task = db.journeys[activeJourneyId].tasks.find(t => t.id === taskId);
             renderModalComments('task-comments-list', task?.comments || []);
         }
        document.getElementById('task-new-comment').value = ''; // Clear input
     }
});

// Person Modal
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
     document.getElementById('person-name').value = person.name || "";
     document.getElementById('person-title').value = person.title || "";
     document.getElementById('person-company').value = person.company || "";
     document.getElementById('person-image').value = person.image || "";
     document.getElementById('person-labels').value = (person.labels || []).join(', ');
     showModal(personModal);
 }
 function handleDeletePersonClick(personId) {
     if (!db.people[personId]) return;
     // Check if person is a participant in any journey
     const isParticipant = Object.values(db.journeys).some(j =>
         (j.participants || []).some(p => p.id === personId)
     );
     if (isParticipant) {
         alert(`Cannot delete "${db.people[personId].name}" as they are a participant in one or more journeys. Please remove them from journeys first.`);
         return;
     }

     if (confirm(`Are you sure you want to delete ${db.people[personId].name}? This cannot be undone.`)) {
         delete db.people[personId];
         alert("Person deleted.");
         renderPeople(); // Re-render the people list
     }
 }

 document.getElementById('save-person-btn').addEventListener('click', () => {
     const name = document.getElementById('person-name').value.trim();
     if (!name) { alert("Person name is required."); return; }
     const editId = document.getElementById('edit-person-id').value;
     const personData = {
         name: name,
         title: document.getElementById('person-title').value.trim(),
         company: document.getElementById('person-company').value.trim(),
         image: document.getElementById('person-image').value.trim(),
         labels: parseLabels(document.getElementById('person-labels').value)
     };

     if (editId) {
         db.people[editId] = { ...db.people[editId], ...personData }; // Merge, keeping original ID
         alert("Person updated.");
     } else {
         const newId = generateId('p');
         personData.id = newId;
         db.people[newId] = personData;
         alert("Person added.");
     }
     renderPeople(); // Re-render the people list
     hideModal(personModal);
 });

// Contract Modal
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
     const contract = db.contracts[contractId];
     if (!contract) return;
     document.getElementById('contract-modal-title').textContent = "Edit Contract";
     document.getElementById('edit-contract-id').value = contract.id;
     document.getElementById('contract-with').value = contract.contractWith || "";
     document.getElementById('contract-summary').value = contract.summary || "";
     document.getElementById('contract-start-date').value = contract.startDate || "";
     document.getElementById('contract-end-date').value = contract.endDate || "";
     document.getElementById('contract-files').value = "";
     // Display existing files (simulation)
     const fileList = document.getElementById('contract-file-list');
     fileList.innerHTML = '';
     (contract.files || []).forEach(f => {
         const li = document.createElement('li');
         li.className = 'list-group-item py-1'; // Smaller padding
         li.textContent = f;
         // Add a remove button maybe? For now, just list them.
         fileList.appendChild(li);
     });
     showModal(contractModal);
 }
  function handleDeleteContractClick(contractId) {
     if (!db.contracts[contractId]) return;
     if (confirm(`Are you sure you want to delete the contract with ${db.contracts[contractId].contractWith || 'this entity'}? This cannot be undone.`)) {
         delete db.contracts[contractId];
         alert("Contract deleted.");
         renderContracts(); // Re-render contract list
     }
 }

 document.getElementById('save-contract-btn').addEventListener('click', () => {
     const contractWith = document.getElementById('contract-with').value.trim();
     if (!contractWith) { alert("Contract With field is required."); return; }
     const editId = document.getElementById('edit-contract-id').value;
     // Simulate file handling
     const fileInput = document.getElementById('contract-files');
     let fileNames = [];
     if (editId && db.contracts[editId]) { // Keep existing files if editing unless new ones are added
        fileNames = db.contracts[editId].files || [];
     }
     if (fileInput.files.length > 0) { // If new files are selected, replace old ones (simple approach)
         fileNames = Array.from(fileInput.files).map(f => f.name);
     }

     const contractData = {
         contractWith: contractWith,
         summary: document.getElementById('contract-summary').value.trim(),
         startDate: document.getElementById('contract-start-date').value || null,
         endDate: document.getElementById('contract-end-date').value || null,
         files: fileNames
     };

     if (editId) {
         db.contracts[editId] = { ...db.contracts[editId], ...contractData }; // Merge, keeping ID
         alert("Contract updated.");
     } else {
         const newId = generateId('c');
         contractData.id = newId;
         db.contracts[newId] = contractData;
         alert("Contract added.");
     }
     renderContracts(); // Re-render contract list
     hideModal(contractModal);
 });


// Generic Modal Dismiss
document.querySelectorAll('[data-dismiss="modal"]').forEach(button => {
    button.addEventListener('click', () => {
        hideModal(button.closest('.modal-backdrop'));
    });
});
document.querySelectorAll('.modal-backdrop').forEach(backdrop => {
    backdrop.addEventListener('click', (e) => {
        if (e.target === backdrop) {
            hideModal(backdrop);
        }
    });
});

 // --- Tag Input Implementation ---
function setupTagInput(containerId, initialTags = []) {
    const container = document.getElementById(containerId);
    if (!container) {
        console.error("Tag input container not found:", containerId);
        return;
    }
    // Clear previous tags but keep the input
    container.querySelectorAll('.tag-item').forEach(t => t.remove());
    let input = container.querySelector('input');
    if (!input) { // Add input if it doesn't exist
         input = document.createElement('input');
         input.type = 'text';
         input.placeholder = containerId === 'filter-labels-input-container' ? 'Type label and press Enter...' : 'Add...';
         container.appendChild(input);
    } else {
        input.value = ''; // Clear existing input value
    }

    (initialTags || []).forEach(tag => addTag(container, input, tag));

    // Remove previous listeners before adding new ones to prevent duplicates
    // This approach is simpler than tracking listeners individually
    const newInput = input.cloneNode(true);
    container.replaceChild(newInput, input);
    input = newInput;

    // Add listeners specific to non-filter inputs
    if (containerId !== 'filter-labels-input-container') {
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
        // Add remove listener via delegation on container
         container.addEventListener('click', (e) => {
             if (e.target.classList.contains('remove-tag')) {
                 e.target.closest('.tag-item').remove();
             }
         });
    }
    // Note: Filter input listeners are added separately in loadJourneyDetail
}


function addTag(container, inputElement, tagText) {
     // Prevent adding duplicate tags
     const existingTags = getTagsFromInput(container.id);
     if (existingTags.includes(tagText)) {
         inputElement.value = ''; // Clear input even if duplicate
         return;
     }

    const tag = document.createElement('span');
    tag.className = 'tag-item';
    tag.textContent = tagText;
    const removeBtn = document.createElement('span');
    removeBtn.className = 'remove-tag';
    removeBtn.innerHTML = '&times;';
    removeBtn.title = 'Remove tag';
    // Remove listener handled by delegation on container now for non-filter inputs
    // removeBtn.onclick = () => tag.remove(); // Keep for filter input if needed, but delegation is better
    tag.appendChild(removeBtn);
    container.insertBefore(tag, inputElement);
}

function getTagsFromInput(containerId) {
    const tags = [];
    const container = document.getElementById(containerId);
    if (container) {
        container.querySelectorAll('.tag-item').forEach(tagElement => {
            // Get text content, excluding the remove button text
            tags.push(tagElement.firstChild.textContent.trim());
        });
    }
    return tags;
}

 // --- Modal Comment Rendering ---
 function renderModalComments(listId, comments) {
     const list = document.getElementById(listId);
     list.innerHTML = '';
     if (!comments || comments.length === 0) {
         list.innerHTML = '<p class="text-placeholder">No comments yet.</p>';
         return;
     }
      // Sort comments oldest first for modal display
      const sortedComments = [...comments].sort((a, b) => new Date(a.time || 0) - new Date(b.time || 0));

     sortedComments.forEach(comment => {
         const div = document.createElement('div');
         div.className = 'comment-item';
         div.innerHTML = `
             <div class="comment-meta"><strong>${comment.by || comment.user || 'Unknown'}</strong> <span class="time">${formatDateTime(comment.time)}</span></div>
             <div class="comment-text">${comment.text.replace(/@(\w+[\s\w]*)/g, '<strong>@$1</strong>')}</div>
         `;
         list.appendChild(div);
     });
     // Scroll to bottom
     list.scrollTop = list.scrollHeight;
 }

// --- Initial Load ---
renderJourneyOverview();
updateHeader();
updateNav();

}); // End DOMContentLoaded