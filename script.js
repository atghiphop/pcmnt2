document.addEventListener('DOMContentLoaded', function() {
    // === GLOBAL STATE ===
    let currentView = 'journey-overview';
    let activeJourneyId = null;
    let isNewJourney = false;
    let currentUser = { name: "Demo Member", id: "user0" }; // Logged-in user
    let activeFilterLabels = [];
    let isJourneyLocked = false;
    let journeyOriginalSnapshot = null;
    let journeyUnlockLogIndex = 0;

    // 9-step phases, plus we store typical ownership
    const defaultPhases = [
        "Project Identification (Smart Onboarding)",
        "Scope & Estimate (TruPriceData™)",
        "Compliance Submission",
        "Proposal Delivery",
        "Purchase Order Submission",
        "Work Begins",
        "Vendor PO Reporting",
        "PO & Compliance Verification",
        "Billing & Feedback"
    ];
    const phaseOwnership = [
        "MEMBER",
        "VENDOR",
        "VENDOR",
        "VENDOR",
        "MEMBER",
        "VENDOR",
        "VENDOR",
        "CO-OP",
        "MEMBER"
    ];
    const defaultStatuses = ["Preparing", "Reviewing", "Waiting", "Complete"];

    // In-memory DB
    let db = {
        journeys: {},
        people: {
            // Example People
            "p2": {
                id: "p2",
                name: "BrightLight Vendor",
                title: "Sales Lead",
                company: "BrightLight Inc.",
                labels: ["Approved Vendor", "Lighting"],
                location: "New York",
                image: ""
            },
            "p3": {
                id: "p3",
                name: "ACME Supplier",
                title: "Rep",
                company: "ACME Co",
                labels: ["Approved Vendor", "HVAC"],
                location: "Dallas",
                image: ""
            },
            "p4": {
                id: "p4",
                name: "Jane Owner",
                title: "Owner Rep",
                company: "XYZ Co",
                labels: ["Stakeholder"],
                location: "Miami",
                image: ""
            }
        },
        settings: {
            defaultMilestones: [...defaultPhases],
            defaultRoles: ["Member", "Vendor", "Stakeholder", "Other"],
            templates: [
                {
                    id: generateId('tmpl'),
                    phaseIndex: 0,
                    name: "Verify project & select vendor",
                    type: "task",
                    content: "Verify project suitability in eConverge and choose an approved vendor"
                },
                {
                    id: generateId('tmpl'),
                    phaseIndex: 1,
                    name: "Prepare Scope & Estimate",
                    type: "task",
                    content: "Use TruPriceData™ to prepare the scope of work and estimate"
                },
                {
                    id: generateId('tmpl'),
                    phaseIndex: 2,
                    name: "Compliance Submission Checklist",
                    type: "checklist",
                    content: "Upload proposal\nConfirm estimate details\nSubmit to Co-op"
                },
                {
                    id: generateId('tmpl'),
                    phaseIndex: 3,
                    name: "Deliver approved proposal",
                    type: "task",
                    content: "Send the approved proposal package to the member"
                },
                {
                    id: generateId('tmpl'),
                    phaseIndex: 4,
                    name: "Submit Purchase Order",
                    type: "task",
                    content: "Digitally send the Purchase Order to the Co-op"
                },
                {
                    id: generateId('tmpl'),
                    phaseIndex: 5,
                    name: "Work tracking checklist",
                    type: "checklist",
                    content: "Start work\nPost progress updates\nConfirm milestones"
                },
                {
                    id: generateId('tmpl'),
                    phaseIndex: 6,
                    name: "Upload missing PO",
                    type: "task",
                    content: "Ensure the Purchase Order is uploaded if it was missed"
                },
                {
                    id: generateId('tmpl'),
                    phaseIndex: 7,
                    name: "Verify PO & compliance",
                    type: "task",
                    content: "Confirm PO and compliance requirements with the Co-op"
                },
                {
                    id: generateId('tmpl'),
                    phaseIndex: 8,
                    name: "Billing & Feedback Checklist",
                    type: "checklist",
                    content: "Receive invoice\nMake payment\nProvide feedback and ratings"
                }
            ]
        },
        fileBox: []
    };

    // For demonstration, add an example journey:
    db.journeys["j1"] = {
        id: "j1",
        name: "Office Lighting Upgrade",
        vendors: ["p2"],
        location: ["123 Main St"],
        phaseIndex: 2,
        assignedParty: phaseOwnership[2],
        nextDeadline: "2025-06-01",
        status: "Compliance Submission",
        lastUpdate: "2025-04-20T10:30:00Z",
        updatedBy: "Demo Member",
        description: "Upgrade office lighting to LED fixtures.",
        customStatus: null,
        phases: [...defaultPhases],
        participants: [
            { id: "user0", name: "Demo Member", role: "Member", labels: ["Owner"] },
            { id: "p2", name: "BrightLight Vendor", role: "Vendor", labels: ["Approved Vendor"] }
        ],
        documents: [
            {
                id: "d1",
                name: "Initial Scope.pdf",
                description: "Lighting scope details",
                added: "2025-04-15T09:00:00Z",
                addedBy: "Demo Member",
                labels: ["Scope"],
                comments: [
                    { by: "Demo Member", time: "2025-04-15T09:05:00Z", text: "Initial doc" }
                ]
            }
        ],
        tasks: [
            {
                id: "t1",
                type: "task",
                description: "Check existing fixture inventory",
                assignee: "p2",
                interested: [],
                dueDate: "2025-05-01",
                completed: false,
                labels: ["Vendor Action"],
                comments: []
            }
        ],
        activityLog: [
            { 
                time: "2025-04-20T10:30:00Z",
                user: "Demo Member",
                action: "Phase advanced to Compliance Submission",
                phase: "Compliance Submission" 
            },
            {
                time: "2025-04-15T09:00:00Z",
                user: "Demo Member",
                action: "Created Journey 'Office Lighting Upgrade'",
                phase: "Project Identification (Smart Onboarding)"
            }
        ],
        commentHistory: [
            {
                time: "2025-04-15T09:05:00Z",
                user: "Demo Member",
                text: "Initial doc",
                phase: "Project Identification (Smart Onboarding)",
                context: { type: 'document', id: 'd1' }
            }
        ],
        estimates: [],
        poNumber: "",
        rating: null,
        feedback: "",
        suitable: false
    };

    // === DOM ELEMENTS ===
    const headerTitle = document.getElementById('header-title');
    const headerActionButton = document.getElementById('header-action-button');

    const views = {
        'journey-overview': document.getElementById('journey-overview-view'),
        'journey-detail': document.getElementById('journey-detail-view'),
        'people': document.getElementById('people-view'),
        'filebox': document.getElementById('filebox-view'),
        'settings': document.getElementById('settings-view')
    };

    const navItems = {
        journeys: document.getElementById('nav-journeys'),
        people: document.getElementById('nav-people'),
        filebox: document.getElementById('nav-filebox'),
        settings: document.getElementById('nav-settings')
    };

    // Journey Overview
    const journeyListTbody = document.getElementById('journey-list-tbody');

    // Journey Detail
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
    const estimatesList = document.getElementById('estimates-list');
    const addEstimateBtn = document.getElementById('add-estimate-btn');
    const poNumberInput = document.getElementById('po-number-input');
    const feedbackRatingInput = document.getElementById('feedback-rating-input');
    const feedbackCommentsInput = document.getElementById('feedback-comments-input');
    const savePoFeedbackBtn = document.getElementById('save-po-feedback-btn');
    const commentHistoryList = document.getElementById('comment-history-list');
    const activityLogList = document.getElementById('activity-log-list');

    // People
    const peopleListTbody = document.getElementById('people-list-tbody');

    // File Box
    const fileboxList = document.getElementById('filebox-list');

    // Settings
    const milestonesEl = document.getElementById('default-milestones');
    const rolesEl = document.getElementById('default-roles');
    const templateEntriesContainer = document.getElementById('template-entries');
    const addTemplateBtn = document.getElementById('add-template-btn');

    // Vendor Picker Modal
    const vendorPickerModal = document.getElementById('vendor-picker-modal');
    const vendorSearchInput = document.getElementById('vendor-search-input');
    const vendorLocationInput = document.getElementById('vendor-location-input');
    const vendorFilterBtn = document.getElementById('vendor-filter-button');
    const vendorPickerTbody = document.getElementById('vendor-picker-tbody');
    const vendorPickerSaveBtn = document.getElementById('vendor-picker-save-btn');

    // Modals
    const journeyDetailsModal = document.getElementById('journey-details-modal');
    const editPhasesModal = document.getElementById('edit-phases-modal');
    const participantModal = document.getElementById('participant-modal');
    const documentModal = document.getElementById('document-modal');
    const taskModal = document.getElementById('task-modal');
    const estimateModal = document.getElementById('estimate-modal');
    const estimateItemsContainer = document.getElementById('estimate-items-container');
    const addEstimateItemBtn = document.getElementById('add-estimate-item-btn');
    const estimateTotalInput = document.getElementById('estimate-total');
    const editEstimateIdInput = document.getElementById('edit-estimate-id');
    const saveEstimateBtn = document.getElementById('save-estimate-btn');
    const personModal = document.getElementById('person-modal');
    const fileboxModal = document.getElementById('filebox-modal');
    const confirmLockModal = document.getElementById('confirm-lock-modal');
    const confirmLockModalBody = document.getElementById('confirm-lock-modal-body');

    // Utility: show/hide views
    function showView(viewId) {
        Object.values(views).forEach(v => v.classList.add('hidden'));
        if (views[viewId]) views[viewId].classList.remove('hidden');
        currentView = viewId;
        updateHeader();
        updateNav();
    }
    function updateHeader() {
        switch (currentView) {
            case 'journey-overview':
                headerTitle.textContent = 'Journey Overview';
                headerActionButton.innerHTML = '<i class="fa-solid fa-plus"></i> New Journey';
                headerActionButton.onclick = handleNewJourneyClick;
                headerActionButton.classList.remove('hidden');
                break;
            case 'journey-detail':
                if (activeJourneyId && db.journeys[activeJourneyId]) {
                    headerTitle.textContent = `Journey: ${db.journeys[activeJourneyId].name}`;
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
    }
    function updateNav() {
        Object.values(navItems).forEach(item => item.classList.remove('active'));
        if (currentView.startsWith('journey')) {
            navItems.journeys.classList.add('active');
        } else if (navItems[currentView]) {
            navItems[currentView].classList.add('active');
        }
    }
    function showModal(m) { m.style.display = 'flex'; }
    function hideModal(m) { m.style.display = 'none'; }

    // Nav item clicks
    navItems.journeys.addEventListener('click', () => {
        showView('journey-overview');
    });
    navItems.people.addEventListener('click', () => {
        renderPeople();
        showView('people');
    });
    navItems.filebox.addEventListener('click', () => {
        renderFileBox();
        showView('filebox');
    });
    navItems.settings.addEventListener('click', () => {
        renderSettings();
        showView('settings');
    });

    // Format/Helper Functions
    function timeAgo(dstr) {
        if(!dstr) return '';
        const date = new Date(dstr);
        const now = new Date();
        const secs = Math.floor((now - date)/1000);
        if(secs < 5) return 'just now';
        let interval = Math.floor(secs/31536000);
        if(interval>=1) return interval+' year'+(interval>1?'s':'')+' ago';
        interval = Math.floor(secs/2592000);
        if(interval>=1) return interval+' month'+(interval>1?'s':'')+' ago';
        interval = Math.floor(secs/86400);
        if(interval>=1) return interval+' day'+(interval>1?'s':'')+' ago';
        interval = Math.floor(secs/3600);
        if(interval>=1) return interval+' hour'+(interval>1?'s':'')+' ago';
        interval = Math.floor(secs/60);
        if(interval>=1) return interval+' minute'+(interval>1?'s':'')+' ago';
        return Math.floor(secs)+' second'+(secs>1?'s':'')+' ago';
    }
    function formatDate(dateStr) {
        if(!dateStr) return 'N/A';
        try {
            const d = new Date(dateStr+'T00:00:00');
            return d.toLocaleDateString('en-US',{ year:'numeric', month:'short', day:'numeric'});
        } catch{ return dateStr;}
    }
    function parseLabels(str) {
        if(!str) return [];
        return str.split(',').map(s=>s.trim()).filter(s=>s);
    }
    function formatLabels(arr) {
        if(!arr||!arr.length) return '';
        return arr.map(l=>`<span class="label-badge">${l}</span>`).join(' ');
    }
    function generateId(prefix='') {
        return prefix + Date.now().toString(36) + Math.random().toString(36).substring(2,5);
    }

    // Render: Journeys
    function renderJourneyOverview() {
        journeyListTbody.innerHTML = '';
        const jArr = Object.values(db.journeys);
        if(!jArr.length) {
            journeyListTbody.innerHTML = `<tr><td colspan="9" class="text-placeholder">No journeys found. Click 'New Journey' to create one.</td></tr>`;
            return;
        }
        jArr.sort((a,b)=> new Date(b.lastUpdate||0) - new Date(a.lastUpdate||0));
        jArr.forEach(j => {
            const tr = document.createElement('tr');
            tr.classList.add('cursor-pointer');
            tr.dataset.journeyId = j.id;
            const phaseName = j.phases[j.phaseIndex] || 'N/A';
            const status = j.customStatus || j.status || phaseName;
            const statusClass = status.toLowerCase().replace(/\s+/g,'-').replace(/[^a-z0-9-]/g,'');
            let vendorNames="N/A";
            if(j.vendors&& j.vendors.length){
                const vendorList = j.vendors.map(vId => {
                    const p = db.people[vId];
                    return p?p.name: vId;
                });
                vendorNames = vendorList.join(", ");
            }
            tr.innerHTML=`
                <td>${j.name}</td>
                <td>${vendorNames}</td>
                <td>${(j.location||[]).join(', ')||'N/A'}</td>
                <td>${phaseName}</td>
                <td>${j.assignedParty||'N/A'}</td>
                <td>${formatDate(j.nextDeadline)}</td>
                <td><span class="status-badge status-${statusClass}">${status}</span></td>
                <td>${timeAgo(j.lastUpdate)}</td>
                <td>${j.updatedBy||'N/A'}</td>
            `;
            tr.onclick = () => loadJourneyDetail(j.id);
            journeyListTbody.appendChild(tr);
        });
    }

    function loadJourneyDetail(jid) {
        const j = db.journeys[jid];
        if(!j) {
            alert("Journey not found!");
            showView('journey-overview');
            return;
        }
        activeJourneyId = jid;
        journeyDetailTitle.textContent = j.name;

        // Default locking depends on whether this is a brand new journey
        journeySaveButton.onclick = handleJourneyLockToggle;
        if(isNewJourney){
            isJourneyLocked = false;
            journeyStateText.textContent = "Unlocked - Editing";
            journeySaveButton.innerHTML = '<i class="fa-solid fa-lock"></i> Lock In Changes';
            enableJourneyDetailInputs(true);
            journeyOriginalSnapshot = JSON.parse(JSON.stringify(j));
            journeyUnlockLogIndex = j.activityLog.length;
        } else {
            isJourneyLocked = true;
            journeyStateText.textContent = "Journey Locked";
            journeySaveButton.innerHTML = '<i class="fa-solid fa-lock"></i> Unlock';
            enableJourneyDetailInputs(false);
        }

        activeFilterLabels = [];
        renderJourneyStatus(j);
        renderJourneyPhases(j.phases, j.phaseIndex);
        advancePhaseBtn.disabled = j.phaseIndex >= j.phases.length-1;
        showView('journey-detail');
        applyFiltersAndRerender();
        renderCommentHistory(j.commentHistory||[]);
        renderActivityLog(j.activityLog||[]);
        renderJourneyDetailFileBox();
        poNumberInput.value = j.poNumber || '';
        feedbackRatingInput.value = j.rating || '';
        feedbackCommentsInput.value = j.feedback || '';
        renderEstimates(j.estimates||[]);
    }
    function enableJourneyDetailInputs(enable){
        const detailView = document.getElementById('journey-detail-view');
        const allEls = detailView.querySelectorAll('input,select,textarea,button');
        allEls.forEach(el => {
            if(el===journeySaveButton) return;
            el.disabled = !enable;
        });
    }

    // Label Filters
    function getAvailableLabelsForJourney(jid){
        const j = db.journeys[jid];
        if(!j) return [];
        const s = new Set();
        (j.participants||[]).forEach(p => (p.labels||[]).forEach(lb=>s.add(lb)));
        (j.documents||[]).forEach(d => (d.labels||[]).forEach(lb=>s.add(lb)));
        (j.tasks||[]).forEach(t => (t.labels||[]).forEach(lb=>s.add(lb)));
        return Array.from(s).sort();
    }
    function renderAvailableLabels(labels) {
        const container = document.getElementById('available-labels-container');
        const clearBtn = document.getElementById('clear-label-filters-btn');
        container.innerHTML = '';
        if(!labels.length) {
            container.innerHTML = `<span class="text-muted" style="font-size:12px;">No labels found in this journey.</span>`;
            clearBtn.style.display='none';
            return;
        }
        labels.forEach(l => {
            const sp = document.createElement('span');
            sp.className='label-badge';
            sp.textContent=l;
            if(activeFilterLabels.includes(l)) sp.classList.add('active-filter');
            sp.onclick = handleLabelFilterClick;
            container.appendChild(sp);
        });
        clearBtn.style.display = activeFilterLabels.length ? 'inline-block' : 'none';
    }
    function handleLabelFilterClick(e){
        const lbl = e.target.textContent;
        const idx = activeFilterLabels.indexOf(lbl);
        if(idx>=0) {
            activeFilterLabels.splice(idx,1);
            e.target.classList.remove('active-filter');
        } else {
            activeFilterLabels.push(lbl);
            e.target.classList.add('active-filter');
        }
        document.getElementById('clear-label-filters-btn').style.display= activeFilterLabels.length?'inline-block':'none';
        applyFiltersAndRerender();
    }
    document.getElementById('clear-label-filters-btn').onclick = handleClearLabelFilters;
    function handleClearLabelFilters(){
        activeFilterLabels=[];
        document.querySelectorAll('#available-labels-container .label-badge').forEach(el => el.classList.remove('active-filter'));
        document.getElementById('clear-label-filters-btn').style.display='none';
        applyFiltersAndRerender();
    }
    function applyFiltersAndRerender() {
        if(!activeJourneyId|| currentView!=='journey-detail')return;
        const j = db.journeys[activeJourneyId];
        renderDocuments(j.documents||[]);
        renderTasks(j.tasks||[]);
        renderEstimates(j.estimates||[]);
        renderParticipants(j.participants||[]);
        renderNeedsAttention(j);
        const labels = getAvailableLabelsForJourney(activeJourneyId);
        renderAvailableLabels(labels);
    }

    // Journey Phases & Status
    function renderJourneyPhases(phases, activeIndex){
        journeyPhasesDisplay.innerHTML='';
        if(!phases||!phases.length) {
            journeyPhasesDisplay.innerHTML='<p class="text-placeholder">No phases defined.</p>';
            return;
        }
        phases.forEach((ph,i)=>{
            const d = document.createElement('div');
            d.className='phase';
            if(i<activeIndex) d.classList.add('completed');
            if(i===activeIndex) d.classList.add('active');
            d.innerHTML=`
              <div class="phase-dot"></div>
              <div class="phase-label">${ph}</div>
            `;
            journeyPhasesDisplay.appendChild(d);
        });
    }
    function renderJourneyStatus(j) {
        journeyStatusSelect.innerHTML='';
        const currentStd = j.status || j.phases[j.phaseIndex];
        let statuses = [...defaultStatuses];
        if(currentStd && !statuses.includes(currentStd)) statuses.push(currentStd);
        if(j.customStatus && !statuses.includes(j.customStatus)) statuses.push(j.customStatus);
        statuses=[...new Set(statuses)];
        statuses.forEach(s => {
            const opt = document.createElement('option');
            opt.value=s; opt.textContent=s;
            journeyStatusSelect.appendChild(opt);
        });
        const optCustom = document.createElement('option');
        optCustom.value='__custom__';
        optCustom.textContent='Enter Custom Status...';
        journeyStatusSelect.appendChild(optCustom);

        const eff = j.customStatus || currentStd;
        journeyStatusSelect.value= eff;
        journeyStatusCustom.classList.add('hidden');
        journeyStatusCustom.value=j.customStatus||'';
    }
    journeyStatusSelect.onchange = e => {
        if(e.target.value==='__custom__') {
            journeyStatusCustom.classList.remove('hidden');
            journeyStatusCustom.value = db.journeys[activeJourneyId]?.customStatus||'';
            journeyStatusCustom.focus();
        } else {
            journeyStatusCustom.classList.add('hidden');
            if(activeJourneyId && db.journeys[activeJourneyId]) {
                db.journeys[activeJourneyId].status = e.target.value;
                db.journeys[activeJourneyId].customStatus = null;
                logActivity(activeJourneyId, `Status changed to ${e.target.value}`);
            }
        }
    };
    journeyStatusCustom.onblur = e => {
        const val = e.target.value.trim();
        const j = db.journeys[activeJourneyId];
        if(!j) return;
        if(val) {
            j.customStatus = val;
            j.status=null;
            logActivity(activeJourneyId, `Status changed to custom: ${val}`);
            renderJourneyStatus(j);
        } else {
            journeyStatusCustom.classList.add('hidden');
            j.customStatus=null;
            j.status = j.phases[j.phaseIndex];
            renderJourneyStatus(j);
        }
    };
    journeyStatusEditToggle.onclick = () => {
        journeyStatusSelect.value='__custom__';
        journeyStatusCustom.classList.remove('hidden');
        journeyStatusCustom.value = db.journeys[activeJourneyId]?.customStatus||'';
        journeyStatusCustom.focus();
    };

    // Save & Lock toggles
    function handleSaveChanges(){
        if(!activeJourneyId||!db.journeys[activeJourneyId]) return;
        const j = db.journeys[activeJourneyId];
        // final status assignment is already done above
        const msg = isNewJourney
            ? `Saved new Journey '${j.name}'`
            : `Saved changes to Journey '${j.name}'`;
        logActivity(activeJourneyId, msg);
        alert("Changes saved and locked.");
        isNewJourney=false;
        renderJourneyOverview();
    }
    journeySaveButton.onclick = handleSaveChanges;

    function handleJourneyLockToggle() {
        if(isJourneyLocked) {
            // Unlock
            isJourneyLocked=false;
            journeyStateText.textContent="Unlocked - Editing";
            journeySaveButton.innerHTML='<i class="fa-solid fa-lock"></i> Lock In Changes';
            enableJourneyDetailInputs(true);
            if(activeJourneyId && db.journeys[activeJourneyId]) {
                journeyOriginalSnapshot = JSON.parse(JSON.stringify(db.journeys[activeJourneyId]));
                journeyUnlockLogIndex = db.journeys[activeJourneyId].activityLog.length;
            }
        } else {
            // Lock
            const j = db.journeys[activeJourneyId];
            const newEntries = j.activityLog.slice(journeyUnlockLogIndex);
            showConfirmLockModal(newEntries);
        }
    }
    function showConfirmLockModal(list) {
        confirmLockModalBody.innerHTML='';
        if(!list.length) {
            const p = document.createElement('p');
            p.textContent="No changes detected since unlocking. Lock anyway?";
            confirmLockModalBody.appendChild(p);
        } else {
            const p = document.createElement('p');
            p.textContent="These updates will be recorded:";
            confirmLockModalBody.appendChild(p);
            const feed = document.createElement('div');
            feed.className='activity-feed';
            list.forEach(entry => {
                const item = document.createElement('div');
                item.className='feed-item';
                item.innerHTML=`
                    <div class="feed-dot" style="background-color: var(--secondary-color);"></div>
                    <div class="feed-content">
                      <div class="feed-meta"><strong>${entry.user||currentUser.name}</strong> • just now</div>
                      <div class="feed-text">${entry.action}</div>
                    </div>
                `;
                feed.appendChild(item);
            });
            confirmLockModalBody.appendChild(feed);
        }
        showModal(confirmLockModal);
    }
    document.getElementById('confirm-lock-btn').onclick = finalizeLockAndSave;
    function finalizeLockAndSave(){
        hideModal(confirmLockModal);
        handleSaveChanges();
        isJourneyLocked=true;
        journeyStateText.textContent="Journey Locked";
        journeySaveButton.innerHTML='<i class="fa-solid fa-lock"></i> Unlock';
        enableJourneyDetailInputs(false);
        journeyOriginalSnapshot=null;
    }

    // New Journey
    function handleNewJourneyClick(){
        activeJourneyId = generateId('j');
        isNewJourney = true;
        const now = new Date().toISOString();
        db.journeys[activeJourneyId] = {
            id: activeJourneyId,
            name: "New Untitled Journey",
            vendors: [],
            location: [],
            phaseIndex: 0,
            assignedParty: phaseOwnership[0],
            nextDeadline: null,
            status: defaultPhases[0],
            lastUpdate: now,
            updatedBy: currentUser.name,
            description: "",
            customStatus: null,
            phases: db.settings.defaultMilestones?.length 
                        ? [...db.settings.defaultMilestones] 
                        : [...defaultPhases],
            participants: [
                { id: currentUser.id, name: currentUser.name, role:"Member", labels:["Creator"] }
            ],
            documents: [],
            tasks: [],
            activityLog:[
                {
                    time: now,
                    user: currentUser.name,
                    action: `Created Journey 'New Untitled Journey'`,
                    phase: defaultPhases[0]
                }
            ],
            commentHistory:[]
        };
        isJourneyLocked=false;
        loadJourneyDetail(activeJourneyId);
        handleJourneyDetailsClick();
    }

    // Activity & Comments
    function logActivity(jid, action){
        if(!jid||!db.journeys[jid]) return;
        const j = db.journeys[jid];
        if(!j.activityLog) j.activityLog=[];
        j.activityLog.unshift({
            time: new Date().toISOString(),
            user: currentUser.name,
            action,
            phase: j.phases[j.phaseIndex]
        });
        j.lastUpdate = new Date().toISOString();
        j.updatedBy = currentUser.name;
        if(currentView==='journey-detail' && activeJourneyId===jid) {
            renderActivityLog(j.activityLog);
        }
        if(currentView==='journey-overview') {
            renderJourneyOverview();
        }
    }
    function addComment(jid, context, text) {
        if(!jid||!db.journeys[jid]||!text.trim()) return false;
        const j = db.journeys[jid];
        if(!j.commentHistory) j.commentHistory=[];
        const newC = {
            time: new Date().toISOString(),
            user: currentUser.name,
            text: text.trim(),
            phase: j.phases[j.phaseIndex],
            context
        };
        j.commentHistory.unshift(newC);
        // doc or task?
        if(context.type==='document') {
            const d = (j.documents||[]).find(x=>x.id===context.id);
            if(d) {
                if(!d.comments) d.comments=[];
                d.comments.push({by:currentUser.name, time:newC.time, text:newC.text});
            }
        } else if(context.type==='task') {
            const t = (j.tasks||[]).find(x=>x.id===context.id);
            if(t) {
                if(!t.comments) t.comments=[];
                t.comments.push({by:currentUser.name, time:newC.time, text:newC.text});
            }
        }
        logActivity(jid, `Added comment: "${text.substring(0,50)}..."`);
        if(currentView==='journey-detail' && activeJourneyId===jid){
            renderCommentHistory(j.commentHistory);
        }
        return true;
    }
    function renderActivityLog(log) {
        activityLogList.innerHTML='';
        if(!log||!log.length) {
            activityLogList.innerHTML='<p class="text-placeholder">No activity yet.</p>';
            return;
        }
        log.forEach(entry => {
            const div = document.createElement('div');
            div.className='feed-item';
            div.innerHTML=`
              <div class="feed-dot" style="background-color: var(--secondary-color);"></div>
              <div class="feed-content">
                <div class="feed-meta">
                  <strong>${entry.user}</strong> • ${timeAgo(entry.time)}
                  <span class="feed-phase">(${entry.phase})</span>
                </div>
                <div class="feed-text">${entry.action}</div>
              </div>
            `;
            activityLogList.appendChild(div);
        });
    }
    function renderCommentHistory(comments){
        commentHistoryList.innerHTML='';
        if(!comments||!comments.length){
            commentHistoryList.innerHTML='<p class="text-placeholder">No comments yet.</p>';
            return;
        }
        comments.forEach(c=>{
            const div = document.createElement('div');
            div.className='feed-item';
            let ctxText='';
            if(c.context?.type==='document') {
                const doc = db.journeys[activeJourneyId].documents.find(d=>d.id===c.context.id);
                if(doc) ctxText=`on document "${doc.name}"`;
            } else if(c.context?.type==='task') {
                const t = db.journeys[activeJourneyId].tasks.find(tt=>tt.id===c.context.id);
                if(t) ctxText=`on task "${t.description||t.title}"`;
            }
            div.innerHTML=`
                <div class="feed-dot"></div>
                <div class="feed-content">
                  <div class="feed-meta">
                    <strong>${c.user}</strong> • ${timeAgo(c.time)}
                    <span class="feed-phase">(${c.phase})</span>
                  </div>
                  <div class="feed-text">
                    ${c.text.replace(/@(\w+[\s\w]*)/g, '<strong>@$1</strong>')}
                    <span class="text-muted" style="font-size:11px;"> ${ctxText}</span>
                  </div>
                </div>
            `;
            div.onclick = () => {
                if(c.context?.type==='task') handleEditTaskClick(c.context.id);
                if(c.context?.type==='document') handleEditDocumentClick(c.context.id);
            };
            commentHistoryList.appendChild(div);
        });
    }

    // Journey Details Modal
    journeyDetailsButton.onclick = handleJourneyDetailsClick;
    function handleJourneyDetailsClick(){
        if(!activeJourneyId||!db.journeys[activeJourneyId])return;
        const j = db.journeys[activeJourneyId];
        document.getElementById('modal-journey-name').value = j.name||'';
        document.getElementById('modal-journey-description').value = j.description||'';
        setupTagInput('modal-journey-location', j.location||[]);
        document.getElementById('modal-suitable-checkbox').checked = !!j.suitable;

        // Show chosen vendors as label-badges
        const selectedVendorsDisplay = document.getElementById('selected-vendors-display');
        selectedVendorsDisplay.innerHTML='';
        j.vendors.forEach(vId=>{
            const p = db.people[vId];
            const sp = document.createElement('span');
            sp.className='label-badge';
            sp.textContent= p? p.name : vId;
            selectedVendorsDisplay.appendChild(sp);
        });

        showModal(journeyDetailsModal);
    }
    // "Find Vendor(s)" button inside that modal
    document.getElementById('find-vendors-button').onclick = () => {
        vendorSearchInput.value='';
        vendorLocationInput.value='';
        renderVendorPickerTable('','');
        showModal(vendorPickerModal);
    };

    // Vendor Picker
    function renderVendorPickerTable(searchVal, locVal){
        vendorPickerTbody.innerHTML='';
        // Filter: must have "Approved Vendor" in labels, or "Vendor" in role
        const allPeople = Object.values(db.people);
        let vendors = allPeople.filter(p => {
            const isVendor = p.labels?.includes("Approved Vendor") 
                          || (p.labels?.some(lb=>lb.toLowerCase()==='vendor')) 
                          || (p.title?.toLowerCase().includes('vendor'));
            return isVendor;
        });
        // Now filter by searchVal in name or labels
        if(searchVal.trim()) {
            const s = searchVal.toLowerCase();
            vendors = vendors.filter(p => {
                const nameMatch = p.name.toLowerCase().includes(s);
                const labelMatch = (p.labels||[]).some(lb=>lb.toLowerCase().includes(s));
                return (nameMatch||labelMatch);
            });
        }
        // Also filter by location if provided
        if(locVal.trim()) {
            const l = locVal.toLowerCase();
            vendors = vendors.filter(p => p.location?.toLowerCase().includes(l));
        }
        if(!vendors.length) {
            vendorPickerTbody.innerHTML=`<tr><td colspan="5" class="text-placeholder">No vendors match your search.</td></tr>`;
            return;
        }
        vendors.forEach(p=>{
            const tr = document.createElement('tr');
            tr.innerHTML=`
              <td><input type="checkbox" class="vendor-select-chk" data-id="${p.id}"/></td>
              <td>${p.name}</td>
              <td>${p.company||'N/A'}</td>
              <td>${p.location||'N/A'}</td>
              <td>${formatLabels(p.labels||[])}</td>
            `;
            vendorPickerTbody.appendChild(tr);
        });
    }
    vendorFilterBtn.onclick = ()=>{
        const s= vendorSearchInput.value.trim();
        const l= vendorLocationInput.value.trim();
        renderVendorPickerTable(s,l);
    };
    vendorPickerSaveBtn.onclick = ()=>{
        if(!activeJourneyId||!db.journeys[activeJourneyId]) return;
        const j = db.journeys[activeJourneyId];
        // gather checked
        const checks = vendorPickerTbody.querySelectorAll('.vendor-select-chk:checked');
        const newIds = Array.from(checks).map(c=>c.dataset.id);
        newIds.forEach(vId => {
            if(!j.vendors.includes(vId)) j.vendors.push(vId);
            // Also ensure participant added?
            if(!j.participants.some(pp=>pp.id===vId)) {
                const pers = db.people[vId];
                if(pers) {
                    j.participants.push({
                        id: vId,
                        name: pers.name,
                        role: "Vendor",
                        labels: pers.labels||[]
                    });
                }
            }
        });
        logActivity(activeJourneyId, `Selected vendors: ${newIds.join(", ")}`);
        // Immediately update participant list and other filtered views
        applyFiltersAndRerender();
        hideModal(vendorPickerModal);
        handleJourneyDetailsClick();
    };

    document.getElementById('save-journey-details-btn').onclick = () => {
        if(!activeJourneyId||!db.journeys[activeJourneyId]) return;
        const j = db.journeys[activeJourneyId];
        const oldName = j.name;
        j.name = document.getElementById('modal-journey-name').value.trim() || 'Untitled Journey';
        j.description = document.getElementById('modal-journey-description').value.trim();
        j.location = getTagsFromInput('modal-journey-location');
        j.suitable = document.getElementById('modal-suitable-checkbox').checked;

        if(j.name!==oldName) {
            logActivity(activeJourneyId, `Journey name changed from "${oldName}" to "${j.name}"`);
        } else {
            logActivity(activeJourneyId, `Journey details updated`);
        }
        journeyDetailTitle.textContent=j.name;
        renderJourneyOverview();
        hideModal(journeyDetailsModal);
    };

    // Edit Phases
    editPhasesBtn.onclick = handleEditPhasesClick;
    function handleEditPhasesClick(){
        if(!activeJourneyId||!db.journeys[activeJourneyId])return;
        const j = db.journeys[activeJourneyId];
        renderPhasesForEditModal(j.phases||[]);
        showModal(editPhasesModal);
    }
    function renderPhasesForEditModal(phases){
        const list = document.getElementById('modal-phases-list');
        list.innerHTML='';
        phases.forEach((ph,i)=>{
            const li = document.createElement('li');
            li.className='list-group-item';
            li.innerHTML=`
              <span>${ph}</span>
              <button class="btn btn-sm btn-outline-danger delete-phase-btn" data-index="${i}" title="Delete Phase">
                <i class="fa-solid fa-trash-alt"></i>
              </button>
            `;
            list.appendChild(li);
        });
        list.querySelectorAll('.delete-phase-btn').forEach(btn=>{
            btn.onclick = e => {
                const idx= parseInt(e.currentTarget.dataset.index);
                if(idx===db.journeys[activeJourneyId].phaseIndex) {
                    alert("Cannot delete the currently active phase.");
                    return;
                }
                e.currentTarget.closest('li').remove();
            };
        });
    }
    document.getElementById('add-new-phase-btn').onclick = () => {
        const inp = document.getElementById('new-phase-name');
        const val = inp.value.trim();
        if(!val)return;
        const list = document.getElementById('modal-phases-list');
        const li = document.createElement('li');
        li.className='list-group-item';
        li.innerHTML=`
          <span>${val}</span>
          <button class="btn btn-sm btn-outline-danger delete-phase-btn" title="Delete Phase">
            <i class="fa-solid fa-trash-alt"></i>
          </button>
        `;
        list.appendChild(li);
        inp.value='';
        li.querySelector('.delete-phase-btn').onclick = ev=>{
            ev.currentTarget.closest('li').remove();
        };
    };
    document.getElementById('save-phases-btn').onclick = () => {
        if(!activeJourneyId||!db.journeys[activeJourneyId])return;
        const j = db.journeys[activeJourneyId];
        const newPhases=[];
        document.querySelectorAll('#modal-phases-list li span').forEach(s=>{
            newPhases.push(s.textContent);
        });
        if(!newPhases.length){
            alert("Cannot save with no phases!");
            return;
        }
        const currentPhaseName = j.phases[j.phaseIndex];
        const newIndex = newPhases.indexOf(currentPhaseName);
        j.phases=newPhases;
        j.phaseIndex = (newIndex>-1)? newIndex:0;
        j.status= j.phases[j.phaseIndex];
        logActivity(activeJourneyId, "Journey phases updated");
        renderJourneyPhases(j.phases, j.phaseIndex);
        advancePhaseBtn.disabled= j.phaseIndex>= j.phases.length-1;
        hideModal(editPhasesModal);
    };

    // Advance Phase
    advancePhaseBtn.onclick = handleAdvancePhaseClick;
    function handleAdvancePhaseClick(){
        if(!activeJourneyId||!db.journeys[activeJourneyId])return;
        const j = db.journeys[activeJourneyId];
        if(j.phaseIndex< j.phases.length-1){
            j.phaseIndex++;
            j.status= j.phases[j.phaseIndex];
            j.customStatus=null;
            j.assignedParty=phaseOwnership[j.phaseIndex]||"Unknown";
            logActivity(activeJourneyId, `Phase advanced to ${j.status}`);
            const comment= prompt("Add comment for phase transition (optional):");
            if(comment?.trim()){
                addComment(activeJourneyId, {type:'journey'}, comment.trim());
                logActivity(activeJourneyId, `Comment on phase '${j.status}': "${comment.trim()}"`);
            }
            renderJourneyPhases(j.phases, j.phaseIndex);
            renderJourneyStatus(j);
            advancePhaseBtn.disabled= j.phaseIndex>= j.phases.length-1;
            renderJourneyOverview();
        }
    }

    // Participants
    addParticipantBtn.onclick = handleAddParticipantClick;
    const toggleParticipantsEditBtn = document.getElementById('toggle-participants-edit-btn');
    toggleParticipantsEditBtn.onclick = ()=> participantsList.classList.toggle('editing');

    function renderParticipants(arr){
        participantsList.innerHTML='';
        const fLabels = activeFilterLabels;
        let filtered = arr;
        if(fLabels.length){
            filtered = arr.filter(p => {
                const lbs = p.labels||[];
                return fLabels.every(fl=> lbs.includes(fl));
            });
        }
        if(!filtered.length){
            const msg= fLabels.length?"No participants match the filter.":"No participants added yet.";
            participantsList.innerHTML=`<p class="text-placeholder">${msg}</p>`;
            return;
        }
        filtered.forEach((p, i) =>{
            const originalIdx = arr.indexOf(p);
            const div = document.createElement('div');
            div.className='participant-item';
            let icon='fa-user';
            if((p.role||'').toLowerCase().includes('vendor')) icon='fa-user-hard-hat';
            else if((p.role||'').toLowerCase().includes('member')) icon='fa-user-check';
            div.innerHTML=`
              <div class="participant-icon"><i class="fa-solid ${icon}"></i></div>
              <div class="participant-name">${p.name}</div>
              <div class="participant-role">${p.role}</div>
              <div class="participant-labels-display">${formatLabels(p.labels||[])}</div>
              <button class="btn btn-sm btn-outline-primary mt-1 edit-participant-btn" data-idx="${originalIdx}">
                <i class="fa-solid fa-pencil"></i>
              </button>
              <button class="btn btn-sm btn-outline-danger mt-1 remove-participant-btn" data-idx="${originalIdx}">
                <i class="fa-solid fa-trash"></i>
              </button>
            `;
            participantsList.appendChild(div);
        });
        participantsList.querySelectorAll('.edit-participant-btn').forEach(btn => {
            btn.onclick = e => handleEditParticipantClick(parseInt(e.currentTarget.dataset.idx));
        });
        participantsList.querySelectorAll('.remove-participant-btn').forEach(btn => {
            btn.onclick = e => handleRemoveParticipantClick(parseInt(e.currentTarget.dataset.idx));
        });
    }
    function handleAddParticipantClick(){
        document.getElementById('participant-modal-title').textContent="Add Participant";
        document.getElementById('edit-participant-index').value="";
        document.getElementById('participant-name').value="";
        document.getElementById('participant-role').innerHTML = "";
        db.settings.defaultRoles.forEach(r=>{
            const opt = document.createElement('option');
            opt.value=r; opt.textContent=r;
            document.getElementById('participant-role').appendChild(opt);
        });
        document.getElementById('participant-labels').value="";
        document.getElementById('participant-search').value="";
        document.getElementById('participant-picklist').innerHTML='';
        document.getElementById('participant-picklist').style.display='none';
        showModal(participantModal);
    }
    function handleEditParticipantClick(idx){
        const j = db.journeys[activeJourneyId];
        if(!j) return;
        if(idx<0|| idx>= j.participants.length)return;
        const p = j.participants[idx];
        document.getElementById('participant-modal-title').textContent="Edit Participant";
        document.getElementById('edit-participant-index').value= idx;
        document.getElementById('participant-name').value = p.name;
        const roleSel= document.getElementById('participant-role');
        roleSel.innerHTML='';
        db.settings.defaultRoles.forEach(r=>{
            const opt = document.createElement('option');
            opt.value=r; opt.textContent=r;
            if(r===p.role) opt.selected=true;
            roleSel.appendChild(opt);
        });
        document.getElementById('participant-labels').value=(p.labels||[]).join(', ');
        document.getElementById('participant-search').value="";
        document.getElementById('participant-picklist').innerHTML='';
        document.getElementById('participant-picklist').style.display='none';
        showModal(participantModal);
    }
    function handleRemoveParticipantClick(idx){
        const j=db.journeys[activeJourneyId];
        if(!j)return;
        if(idx<0|| idx>= j.participants.length)return;
        const r = j.participants[idx];
        if(confirm(`Remove participant "${r.name}"?`)){
            j.participants.splice(idx,1);
            logActivity(activeJourneyId, `Removed participant: ${r.name}`);
            applyFiltersAndRerender();
            renderJourneyOverview();
        }
    }
    document.getElementById('participant-search').oninput = e => {
        const val = e.target.value.toLowerCase();
        const picklist = document.getElementById('participant-picklist');
        picklist.innerHTML='';
        picklist.style.display='none';
        if(val.length<2) return;
        const j= db.journeys[activeJourneyId];
        const jpartIDs = (j?.participants||[]).map(pp=>pp.id);
        Object.values(db.people)
          .filter(pp=> !jpartIDs.includes(pp.id))
          .filter(pp=> pp.name.toLowerCase().includes(val)|| (pp.company||'').toLowerCase().includes(val))
          .forEach(pp=>{
            const d = document.createElement('div');
            d.className='list-group-item list-group-item-action cursor-pointer';
            d.innerHTML=`<strong>${pp.name}</strong> <small>(${pp.company||'N/A'})</small>`;
            d.onclick = ()=>{
                document.getElementById('participant-name').value=pp.name;
                document.getElementById('participant-name').dataset.selectedPersonId=pp.id;
                document.getElementById('participant-labels').value=(pp.labels||[]).join(', ');
                picklist.innerHTML='';
                picklist.style.display='none';
            };
            picklist.appendChild(d);
          });
        if(picklist.children.length>0) picklist.style.display='block';
    };
    document.getElementById('participant-search').onblur = ()=>{
        setTimeout(()=>{
            if(!participantModal.contains(document.activeElement)){
                document.getElementById('participant-picklist').style.display='none';
            }
        },200);
    };
    document.getElementById('save-participant-btn').onclick = () => {
        const j = db.journeys[activeJourneyId];
        if(!j)return;
        const idxStr = document.getElementById('edit-participant-index').value;
        const nameInput = document.getElementById('participant-name');
        const name = nameInput.value.trim();
        const role = document.getElementById('participant-role').value;
        const labels = parseLabels(document.getElementById('participant-labels').value);
        const selectedId = nameInput.dataset.selectedPersonId;
        delete nameInput.dataset.selectedPersonId;
        if(!name){
            alert("Participant name required.");
            return;
        }
        const newP = { id: selectedId|| generateId('p'), name, role, labels};
        if(idxStr){
            const i= parseInt(idxStr);
            if(i>=0 && j.participants[i]) {
                j.participants[i] = {...j.participants[i], ...newP};
                logActivity(activeJourneyId, `Updated participant: ${name}`);
            }
        } else {
            // Add new
            if(j.participants.some(p=>p.id===newP.id)){
                alert(`${name} is already a participant in this journey.`);
                return;
            }
            j.participants.push(newP);
            logActivity(activeJourneyId, `Added participant: ${name} (${role})`);
        }
        applyFiltersAndRerender();
        renderJourneyOverview();
        hideModal(participantModal);
    };

    // Needs Attention
    function renderNeedsAttention(j){
        const listEl = document.getElementById('needs-attention-list');
        listEl.innerHTML='';
        const items=[];
        // tasks assigned to currentUser
        (j.tasks||[]).filter(t=>t.assignee===currentUser.id&&!t.completed).forEach(t=>{
            items.push({type:'task', id:t.id, title:t.description});
        });
        // mention in comments
        (j.commentHistory||[]).filter(c=> c.text.includes('@'+currentUser.name)).forEach(c=>{
            if(c.context.type==='task'){
                const t=j.tasks.find(tt=>tt.id===c.context.id);
                if(t) items.push({type:'task', id:t.id, title:t.description});
            } else if(c.context.type==='document'){
                const d=j.documents.find(dd=>dd.id===c.context.id);
                if(d) items.push({type:'document', id:d.id, title:d.name});
            }
        });
        const unique=[];
        items.forEach(it=>{
            if(!unique.some(u=>u.type===it.type&&u.id===it.id)){
                unique.push(it);
            }
        });
        if(!unique.length){
            listEl.innerHTML='<p class="text-placeholder">No items need attention.</p>';
            return;
        }
        unique.forEach(it=>{
            const d = document.createElement('div');
            d.className=(it.type==='task'?'task-item':'document-item');
            d.innerHTML=`
              <div class="item-icon"><i class="fa-solid ${it.type==='task'?'fa-list-check':'fa-folder-open'}"></i></div>
              <div class="item-info">
                <div class="item-title">${it.title}</div>
              </div>
            `;
            d.onclick =()=>{
                if(it.type==='task') handleEditTaskClick(it.id);
                else handleEditDocumentClick(it.id);
            };
            listEl.appendChild(d);
        });
    }

    // Documents
    function renderDocuments(docs){
        documentsList.innerHTML='';
        const fl= activeFilterLabels;
        let filtered = docs;
        if(fl.length){
            filtered = docs.filter(d=>{
                const lbs= d.labels||[];
                return fl.every(lbl=> lbs.includes(lbl));
            });
        }
        if(!filtered.length){
            const msg = fl.length?"No documents match the filter.":"No documents added yet.";
            documentsList.innerHTML=`<p class="text-placeholder">${msg}</p>`;
            return;
        }
        filtered.sort((a,b)=> new Date(b.added||0)- new Date(a.added||0));
        filtered.forEach(doc=>{
            const div = document.createElement('div');
            div.className='document-item';
            div.dataset.documentId= doc.id;
            div.innerHTML=`
              <div class="item-icon"><i class="fa-solid fa-file-lines"></i></div>
              <div class="item-info">
                <div class="item-title">${doc.name}</div>
                <div class="item-meta">
                  <span class="meta-text">Added ${timeAgo(doc.added)} by ${doc.addedBy||'Unknown'}</span>
                  ${formatLabels(doc.labels||[])}
                </div>
              </div>
            `;
            div.onclick =()=> handleEditDocumentClick(doc.id);
            documentsList.appendChild(div);
        });
    }
    addDocumentBtn.onclick= handleAddDocumentClick;
    function handleAddDocumentClick(){
        document.getElementById('document-modal-title').textContent="Add Document";
        document.getElementById('edit-document-id').value="";
        document.getElementById('document-name').value="";
        document.getElementById('document-description').value="";
        document.getElementById('document-file').value="";
        document.getElementById('document-labels').value="";
        renderModalComments('document-comments-list',[]);
        document.getElementById('document-new-comment').value="";
        showModal(documentModal);
    }
    function handleEditDocumentClick(docId){
        const j = db.journeys[activeJourneyId];
        if(!j)return;
        const d = j.documents.find(x=>x.id===docId);
        if(!d)return;
        document.getElementById('document-modal-title').textContent="Edit Document";
        document.getElementById('edit-document-id').value=d.id;
        document.getElementById('document-name').value= d.name||"";
        document.getElementById('document-description').value= d.description||"";
        document.getElementById('document-file').value="";
        document.getElementById('document-labels').value=(d.labels||[]).join(', ');
        renderModalComments('document-comments-list', d.comments||[]);
        document.getElementById('document-new-comment').value="";
        showModal(documentModal);
    }
    document.getElementById('save-document-btn').onclick=()=>{
        const j= db.journeys[activeJourneyId];
        if(!j)return;
        const docName = document.getElementById('document-name').value.trim();
        if(!docName){
            alert("Document name is required.");
            return;
        }
        const docDesc= document.getElementById('document-description').value.trim();
        const labels = parseLabels(document.getElementById('document-labels').value);
        const editId = document.getElementById('edit-document-id').value;
        if(editId){
            const idx = j.documents.findIndex(d=>d.id===editId);
            if(idx>-1){
                j.documents[idx].name=docName;
                j.documents[idx].description=docDesc;
                j.documents[idx].labels=labels;
                logActivity(activeJourneyId, `Updated document: ${docName}`);
            }
        } else {
            const nd = {
                id: generateId('d'),
                name: docName,
                description: docDesc,
                added:new Date().toISOString(),
                addedBy: currentUser.name,
                labels,
                comments:[]
            };
            j.documents.push(nd);
            logActivity(activeJourneyId, `Added document: ${docName}`);
        }
        applyFiltersAndRerender();
        hideModal(documentModal);
    };
    document.getElementById('add-document-comment-btn').onclick=()=>{
        const text = document.getElementById('document-new-comment').value;
        const docId = document.getElementById('edit-document-id').value;
        if(text && docId && activeJourneyId){
            const ok = addComment(activeJourneyId, {type:'document', id:docId}, text);
            if(ok){
                const j=db.journeys[activeJourneyId];
                const d= j.documents.find(x=>x.id===docId);
                renderModalComments('document-comments-list', d.comments||[]);
            }
            document.getElementById('document-new-comment').value='';
        }
    };
    function renderModalComments(listId, comments){
        const cList = document.getElementById(listId);
        cList.innerHTML='';
        if(!comments||!comments.length){
            cList.innerHTML='<p class="text-placeholder">No comments yet.</p>';
            return;
        }
        const sorted=[...comments].sort((a,b)=> new Date(a.time)- new Date(b.time));
        sorted.forEach(c=>{
            const d= document.createElement('div');
            d.className='comment-item';
            d.innerHTML=`
              <div class="comment-meta">
                <strong>${c.by||c.user}</strong>
                <span class="time">${(new Date(c.time)).toLocaleString()}</span>
              </div>
              <div class="comment-text">
                ${c.text.replace(/@(\w+[\s\w]*)/g, '<strong>@$1</strong>')}
              </div>
            `;
            cList.appendChild(d);
        });
        cList.scrollTop= cList.scrollHeight;
    }

    // Tasks
    addTaskBtn.onclick= handleAddTaskClick;
    function renderTasks(tasks){
        tasksList.innerHTML='';
        let filtered= tasks;
        if(activeFilterLabels.length){
            filtered= tasks.filter(t=>{
                const lbs= t.labels||[];
                return activeFilterLabels.every(lb=> lbs.includes(lb));
            });
        }
        if(!filtered.length){
            const msg= activeFilterLabels.length?"No tasks match the filter.":"No tasks added yet.";
            tasksList.innerHTML=`<p class="text-placeholder">${msg}</p>`;
            return;
        }
        filtered.forEach((t,idx)=>{
            const div= document.createElement('div');
            div.className='task-item';
            div.dataset.taskId= t.id;
            div.style.opacity= t.completed?0.6:1;
            let content="";
            const aname= getParticipantName(t.assignee);
            const dueInfo= t.dueDate? `• Due: ${formatDate(t.dueDate)}`:"";
            const labs= formatLabels(t.labels||[]);
            if(t.type==='checklist'){
                const doneCount= (t.items||[]).filter(x=>x.completed).length;
                const total= (t.items||[]).length;
                const progress= total? `(${doneCount}/${total})`:"";
                content=`
                  <div class="item-icon"><i class="fa-solid fa-list-check"></i></div>
                  <div class="item-info">
                    <div class="item-title">${t.title||"Untitled Checklist"} ${progress}</div>
                    <div class="item-meta">
                      <span class="meta-text">Assigned: ${aname} ${dueInfo}</span>
                      ${labs}
                    </div>
                    ${(t.items||[]).map((it,i2)=>`
                      <div class="checklist-item">
                        <span class="custom-checkbox ${it.completed?'checked':''}" data-task-index="${idx}" data-item-index="${i2}"></span>
                        <span style="${it.completed?'text-decoration: line-through; color:#888;':''}">${it.text}</span>
                      </div>
                    `).join('')}
                  </div>
                `;
            } else {
                content=`
                  <div style="display: flex; align-items:flex-start; flex-grow:1;">
                    <span class="custom-checkbox ${t.completed?'checked':''}" data-task-index="${idx}" style="margin-top:2px;"></span>
                    <div class="item-info" style="margin-left:5px;">
                      <div class="item-title" style="${t.completed?'text-decoration: line-through; color:#888;':''}">
                        ${t.description||'Untitled Task'}
                      </div>
                      <div class="item-meta">
                        <span class="meta-text">Assigned: ${aname} ${dueInfo}</span>
                        ${labs}
                      </div>
                    </div>
                  </div>
                `;
            }
            div.innerHTML= content;
            div.onclick = e => {
                if(!e.target.classList.contains('custom-checkbox')){
                    handleEditTaskClick(t.id);
                }
            };
            tasksList.appendChild(div);
        });
    }
    function getParticipantName(pid, jid=activeJourneyId){
        if(!pid||!jid||!db.journeys[jid]) return pid||'Unknown';
        const arr= db.journeys[jid].participants||[];
        const p = arr.find(x=>x.id===pid);
        return p?.name|| pid;
    }
    tasksList.addEventListener('click', e=>{
        const chk= e.target.closest('.custom-checkbox');
        if(chk){
            const tIdx= parseInt(chk.dataset.taskIndex);
            const iIdx= chk.dataset.itemIndex!==undefined? parseInt(chk.dataset.itemIndex): null;
            const j= db.journeys[activeJourneyId];
            if(!j|| !j.tasks|| !j.tasks[tIdx])return;
            const t= j.tasks[tIdx];
            let completed= chk.classList.toggle('checked');
            let logTxt="";
            if(t.type==='checklist' && iIdx!==null){
                t.items[iIdx].completed= completed;
                logTxt=`Checklist item "${t.items[iIdx].text}" marked ${completed?'complete':'incomplete'} in task "${t.title}"`;
                applyFiltersAndRerender();
            } else if(t.type==='task'){
                t.completed= completed;
                logTxt=`Task "${t.description}" marked ${completed?'complete':'incomplete'}`;
                applyFiltersAndRerender();
            }
            if(logTxt) logActivity(activeJourneyId, logTxt);
        }
    });
    function handleAddTaskClick(){
        document.getElementById('task-modal-title').textContent="Add Task / Checklist";
        document.getElementById('edit-task-id').value="";
        document.getElementById('type-single').checked=true;
        toggleTaskTypeFields('task');
        document.getElementById('task-description').value="";
        document.getElementById('checklist-title').value="";
        document.getElementById('checklist-items-container').innerHTML="";
        addChecklistItemInput();
        populateParticipantDropdown('task-assignee');
        populateParticipantDropdown('task-interested',true);
        document.getElementById('task-due-date').value="";
        document.getElementById('task-labels').value="";
        renderModalComments('task-comments-list',[]);
        document.getElementById('task-new-comment').value="";
        renderTaskTemplateSelect("");
        showModal(taskModal);
    }
    function handleEditTaskClick(tid){
        const j= db.journeys[activeJourneyId];
        if(!j)return;
        const t= j.tasks.find(x=>x.id===tid);
        if(!t)return;
        document.getElementById('task-modal-title').textContent="Edit Task / Checklist";
        document.getElementById('edit-task-id').value=t.id;
        document.getElementById(`type-${t.type==='checklist'?'checklist':'single'}`).checked=true;
        toggleTaskTypeFields(t.type);

        if(t.type==='task'){
            document.getElementById('task-description').value= t.description||"";
        } else {
            document.getElementById('checklist-title').value= t.title||"";
            const ctn= document.getElementById('checklist-items-container');
            ctn.innerHTML='';
            (t.items||[]).forEach(it=> addChecklistItemInput(it.text));
            if(!t.items||!t.items.length) addChecklistItemInput();
        }
        populateParticipantDropdown('task-assignee',false,t.assignee);
        populateParticipantDropdown('task-interested',true,t.interested||[]);
        document.getElementById('task-due-date').value= t.dueDate||"";
        document.getElementById('task-labels').value= (t.labels||[]).join(', ');
        renderModalComments('task-comments-list', t.comments||[]);
        document.getElementById('task-new-comment').value="";
        renderTaskTemplateSelect("");
        showModal(taskModal);
    }
    document.querySelectorAll('input[name="task-type"]').forEach(r=>{
        r.onchange = e => toggleTaskTypeFields(e.target.value);
    });
    function toggleTaskTypeFields(type){
        if(type==='task'){
            document.getElementById('task-single-fields').classList.remove('hidden');
            document.getElementById('task-checklist-fields').classList.add('hidden');
        } else {
            document.getElementById('task-single-fields').classList.add('hidden');
            document.getElementById('task-checklist-fields').classList.remove('hidden');
            if(!document.getElementById('checklist-items-container').children.length){
                addChecklistItemInput();
            }
        }
    }
    document.getElementById('add-checklist-item-btn').onclick=()=> addChecklistItemInput();
    function addChecklistItemInput(val=''){
        const ctn= document.getElementById('checklist-items-container');
        const d= document.createElement('div');
        d.className='checklist-item-input-group';
        d.innerHTML=`
          <input type="text" class="form-control form-control-sm checklist-item-input" placeholder="Checklist item" value="${val}">
          <button type="button" class="btn btn-sm btn-outline-danger remove-checklist-item-btn" title="Remove Item">
            <i class="fa-solid fa-trash-alt"></i>
          </button>
        `;
        d.querySelector('.remove-checklist-item-btn').onclick= e=>{
            if(ctn.children.length>1){
                e.currentTarget.closest('.checklist-item-input-group').remove();
            } else {
                alert("Must have at least one item.");
            }
        };
        ctn.appendChild(d);
    }
    function populateParticipantDropdown(selId, multi=false, selVal=null){
        const sel= document.getElementById(selId);
        if(!sel) return;
        sel.innerHTML='<option value="">-- Select --</option>';
        sel.multiple=!!multi;
        const j= db.journeys[activeJourneyId];
        if(!j)return;
        (j.participants||[]).forEach(p=>{
            const opt= document.createElement('option');
            opt.value=p.id;
            opt.textContent=`${p.name} (${p.role})`;
            sel.appendChild(opt);
        });
        if(multi && Array.isArray(selVal)){
            Array.from(sel.options).forEach(o=>{
                if(selVal.includes(o.value)) o.selected=true;
            });
        } else if(!multi && selVal){
            sel.value=selVal;
        }
    }
    function renderTaskTemplateSelect(value){
        const select= document.getElementById('task-template-select');
        if(!select)return;
        select.innerHTML='<option value="">-- No Template --</option>';
        const j=db.journeys[activeJourneyId];
        const cur=j?j.phaseIndex:0;
        db.settings.templates.forEach(tmpl=>{
            if(tmpl.phaseIndex!==undefined && tmpl.phaseIndex!==cur) return;
            const opt= document.createElement('option');
            opt.value=tmpl.id;
            opt.textContent=tmpl.name;
            select.appendChild(opt);
        });
        select.value=value||"";
    }
    document.getElementById('task-template-select').onchange= e=>{
        const tid= e.target.value;
        if(!tid)return;
        const tmpl= db.settings.templates.find(tt=>tt.id===tid);
        if(!tmpl)return;
        const type= tmpl.type;
        document.querySelector(`input[name="task-type"][value="${type}"]`).checked=true;
        toggleTaskTypeFields(type);
        if(type==='task'){
            document.getElementById('task-description').value= tmpl.content;
        } else {
            document.getElementById('checklist-title').value= tmpl.name;
            const lines= tmpl.content.split('\n').map(x=>x.trim()).filter(x=>x);
            const ctn= document.getElementById('checklist-items-container');
            ctn.innerHTML='';
            if(!lines.length) lines.push("");
            lines.forEach(line=> addChecklistItemInput(line));
        }
    };
    document.getElementById('save-task-btn').onclick=()=>{
        const j= db.journeys[activeJourneyId];
        if(!j)return;
        const editId= document.getElementById('edit-task-id').value;
        const type= document.querySelector('input[name="task-type"]:checked').value;
        const assignee= document.getElementById('task-assignee').value||null;
        const interested= Array.from(document.getElementById('task-interested').selectedOptions).map(o=>o.value);
        const dueDate= document.getElementById('task-due-date').value||null;
        const labels= parseLabels(document.getElementById('task-labels').value);
        const newT= { type, assignee, interested, dueDate, labels, comments:[]};
        let logTxt="";
        if(type==='task'){
            const desc= document.getElementById('task-description').value.trim();
            if(!desc){
                alert("Task description required.");
                return;
            }
            newT.description=desc;
            newT.completed=false;
            logTxt=`Task: ${desc}`;
        } else {
            const title= document.getElementById('checklist-title').value.trim();
            if(!title){
                alert("Checklist title required.");
                return;
            }
            newT.title=title;
            newT.items=[];
            document.querySelectorAll('.checklist-item-input').forEach(ci=>{
                const v= ci.value.trim();
                if(v) newT.items.push({text:v, completed:false});
            });
            if(!newT.items.length){
                alert("Checklist must have at least one item.");
                return;
            }
            newT.completed=false;
            logTxt=`Checklist: ${title}`;
        }
        if(editId){
            const idx= j.tasks.findIndex(x=>x.id===editId);
            if(idx>-1){
                const oldT= j.tasks[idx];
                newT.comments= oldT.comments||[];
                if(oldT.type==='checklist'){
                    // keep item completions if text matches
                    const oldItems= oldT.items||[];
                    newT.items=newT.items.map(ni=>{
                        const found= oldItems.find(oi=>oi.text===ni.text);
                        return {...ni, completed:found?found.completed:false};
                    });
                } else {
                    newT.completed= oldT.completed;
                }
                j.tasks[idx]= {...oldT, ...newT};
                logActivity(activeJourneyId, `Updated ${logTxt}`);
            }
        } else {
            newT.id= generateId('t');
            j.tasks.push(newT);
            logActivity(activeJourneyId, `Added ${logTxt}`);
        }
        applyFiltersAndRerender();
        hideModal(taskModal);
    };
    document.getElementById('add-task-comment-btn').onclick=()=>{
        const text= document.getElementById('task-new-comment').value;
        const tId= document.getElementById('edit-task-id').value;
        if(!text||!tId||!activeJourneyId)return;
        const ok= addComment(activeJourneyId, {type:'task', id:tId}, text);
        if(ok){
            const j= db.journeys[activeJourneyId];
            const t= j.tasks.find(x=>x.id===tId);
            renderModalComments('task-comments-list', t.comments||[]);
        }
        document.getElementById('task-new-comment').value='';
    };

    // Estimates
    addEstimateBtn.onclick = handleAddEstimateClick;
    function renderEstimates(arr){
        estimatesList.innerHTML='';
        if(!arr||!arr.length){
            estimatesList.innerHTML='<p class="text-placeholder">No estimates yet.</p>';
            return;
        }
        arr.forEach(est=>{
            const div=document.createElement('div');
            div.className='estimate-item';
            const total=computeEstimateTotal(est);
            div.innerHTML=`
              <div class="item-icon"><i class="fa-solid fa-file-invoice-dollar"></i></div>
              <div class="item-info">
                <div class="item-title">Estimate ${est.id}</div>
                <div class="item-meta"><span class="meta-text">Total: $${total.toFixed(2)}</span></div>
              </div>`;
            div.onclick=()=> handleEditEstimateClick(est.id);
            estimatesList.appendChild(div);
        });
    }
    function computeEstimateTotal(est){
        return (est.items||[]).reduce((sum,it)=> sum + (parseFloat(it.qty)||0)*(parseFloat(it.price)||0),0);
    }
    function handleAddEstimateClick(){
        document.getElementById('estimate-modal-title').textContent='Add Estimate';
        editEstimateIdInput.value='';
        estimateItemsContainer.innerHTML='';
        addEstimateItemRow();
        updateEstimateTotal();
        showModal(estimateModal);
    }
    function handleEditEstimateClick(eid){
        const j=db.journeys[activeJourneyId];
        if(!j)return;
        const est=j.estimates.find(e=>e.id===eid);
        if(!est)return;
        document.getElementById('estimate-modal-title').textContent='Edit Estimate';
        editEstimateIdInput.value=est.id;
        estimateItemsContainer.innerHTML='';
        (est.items||[]).forEach(it=> addEstimateItemRow(it.desc,it.qty,it.price));
        if(!(est.items||[]).length) addEstimateItemRow();
        updateEstimateTotal();
        showModal(estimateModal);
    }
    function addEstimateItemRow(desc='', qty=1, price=0){
        const row=document.createElement('div');
        row.className='d-flex gap-2 mb-1';
        row.innerHTML=`
           <input type="text" class="form-control form-control-sm est-desc" placeholder="Description" value="${desc}">
           <input type="number" class="form-control form-control-sm est-qty" style="width:80px" value="${qty}">
           <input type="number" class="form-control form-control-sm est-price" style="width:100px" value="${price}">
           <button type="button" class="btn btn-sm btn-outline-danger remove-est-item-btn">&times;</button>`;
        row.querySelector('.remove-est-item-btn').onclick=()=> row.remove();
        estimateItemsContainer.appendChild(row);
    }
    function updateEstimateTotal(){
        const rows=estimateItemsContainer.querySelectorAll('div');
        let total=0;
        rows.forEach(r=>{
            const qty=parseFloat(r.querySelector('.est-qty').value)||0;
            const price=parseFloat(r.querySelector('.est-price').value)||0;
            total += qty*price;
        });
        estimateTotalInput.value='$'+total.toFixed(2);
    }
    estimateItemsContainer.addEventListener('input', updateEstimateTotal);
    addEstimateItemBtn.onclick=()=>{ addEstimateItemRow(); updateEstimateTotal(); };
    saveEstimateBtn.onclick=()=>{
        const j=db.journeys[activeJourneyId];
        if(!j)return;
        const items=[];
        estimateItemsContainer.querySelectorAll('div').forEach(row=>{
            const desc=row.querySelector('.est-desc').value.trim();
            const qty=parseFloat(row.querySelector('.est-qty').value)||0;
            const price=parseFloat(row.querySelector('.est-price').value)||0;
            if(desc) items.push({desc, qty, price});
        });
        const id=editEstimateIdInput.value;
        if(id){
            const idx=j.estimates.findIndex(e=>e.id===id);
            if(idx>-1){ j.estimates[idx].items=items; }
            logActivity(activeJourneyId,'Updated estimate');
        } else {
            j.estimates.push({id:generateId('e'), items});
            logActivity(activeJourneyId,'Added estimate');
        }
        hideModal(estimateModal);
        applyFiltersAndRerender();
    };

    savePoFeedbackBtn.onclick=()=>{
        const j=db.journeys[activeJourneyId];
        if(!j)return;
        j.poNumber = poNumberInput.value.trim();
        j.rating = feedbackRatingInput.value ? parseInt(feedbackRatingInput.value) : null;
        j.feedback = feedbackCommentsInput.value.trim();
        logActivity(activeJourneyId,'Updated PO/feedback');
        renderJourneyOverview();
    };


    // People
    function renderPeople(){
        peopleListTbody.innerHTML='';
        const arr= Object.values(db.people);
        if(!arr.length){
            peopleListTbody.innerHTML=`<tr><td colspan="5" class="text-placeholder">No people found.</td></tr>`;
            return;
        }
        arr.sort((a,b)=> (a.name||'').localeCompare(b.name||''));
        arr.forEach(p=>{
            const tr=document.createElement('tr');
            tr.innerHTML=`
              <td>${p.name||'N/A'}</td>
              <td>${p.title||'N/A'}</td>
              <td>${p.company||'N/A'}</td>
              <td>${formatLabels(p.labels||[])}</td>
              <td>
                <button class="btn btn-sm btn-outline-primary edit-person-btn" data-id="${p.id}">
                  <i class="fa-solid fa-pencil"></i>
                </button>
                <button class="btn btn-sm btn-outline-danger delete-person-btn" data-id="${p.id}">
                  <i class="fa-solid fa-trash"></i>
                </button>
              </td>
            `;
            peopleListTbody.appendChild(tr);
        });
        peopleListTbody.querySelectorAll('.edit-person-btn').forEach(btn=>{
            btn.onclick= ()=> handleEditPersonClick(btn.dataset.id);
        });
        peopleListTbody.querySelectorAll('.delete-person-btn').forEach(btn=>{
            btn.onclick= ()=> handleDeletePersonClick(btn.dataset.id);
        });
    }
    function handleAddPersonClick(){
        document.getElementById('person-modal-title').textContent="Add Person";
        document.getElementById('edit-person-id').value='';
        document.getElementById('person-name').value='';
        document.getElementById('person-title').value='';
        document.getElementById('person-company').value='';
        document.getElementById('person-labels').value='';
        document.getElementById('person-location').value='';
        document.getElementById('person-image').value='';
        showModal(personModal);
    }
    function handleEditPersonClick(pid){
        const p = db.people[pid];
        if(!p)return;
        document.getElementById('person-modal-title').textContent="Edit Person";
        document.getElementById('edit-person-id').value= p.id;
        document.getElementById('person-name').value= p.name||'';
        document.getElementById('person-title').value= p.title||'';
        document.getElementById('person-company').value= p.company||'';
        document.getElementById('person-labels').value= (p.labels||[]).join(', ');
        document.getElementById('person-location').value= p.location||'';
        document.getElementById('person-image').value= p.image||'';
        showModal(personModal);
    }
    function handleDeletePersonClick(pid){
        const p = db.people[pid];
        if(!p)return;
        // check usage
        const used= Object.values(db.journeys).some(j=> (j.participants||[]).some(pp=>pp.id===pid));
        if(used){
            alert(`Cannot delete "${p.name}" because they're in a journey.`);
            return;
        }
        if(confirm(`Delete ${p.name}? This cannot be undone.`)){
            delete db.people[pid];
            alert("Person deleted.");
            renderPeople();
        }
    }
    document.getElementById('save-person-btn').onclick=()=>{
        const editId= document.getElementById('edit-person-id').value;
        const name = document.getElementById('person-name').value.trim();
        if(!name){
            alert("Name required.");
            return;
        }
        const data={
            name,
            title:document.getElementById('person-title').value.trim(),
            company:document.getElementById('person-company').value.trim(),
            labels: parseLabels(document.getElementById('person-labels').value),
            location: document.getElementById('person-location').value.trim(),
            image: document.getElementById('person-image').value.trim()
        };
        if(editId){
            db.people[editId]= {...db.people[editId], ...data};
            alert("Person updated.");
        } else {
            const newId= generateId('p');
            db.people[newId]= { id:newId, ...data};
            alert("Person added.");
        }
        renderPeople();
        hideModal(personModal);
    };

    // File Box
    function renderFileBox(){
        fileboxList.innerHTML='';
        if(!db.fileBox.length){
            fileboxList.innerHTML='<p class="text-placeholder">No files in the File Box yet.</p>';
            return;
        }
        db.fileBox.forEach(f=>{
            const div= document.createElement('div');
            div.className='document-item';
            div.draggable=true;
            div.dataset.fileboxId=f.id;
            div.ondragstart= handleFileBoxDragStart;
            div.innerHTML=`
              <div class="item-icon"><i class="fa-solid fa-box-archive"></i></div>
              <div class="item-info">
                <div class="item-title">${f.name}</div>
                <div class="item-meta">
                  <span class="meta-text">${f.description||''}</span>
                  ${formatLabels(f.labels||[])}
                </div>
              </div>
            `;
            div.onclick=()=> handleEditFileBoxClick(f.id);
            fileboxList.appendChild(div);
        });
    }
    function renderJourneyDetailFileBox(){
        const ctn= document.getElementById('journey-filebox-container');
        ctn.innerHTML='';
        if(!db.fileBox.length){
            ctn.innerHTML='<p class="text-placeholder">No files in the File Box yet.</p>';
            return;
        }
        db.fileBox.forEach(f=>{
            const div= document.createElement('div');
            div.className='document-item';
            div.draggable=true;
            div.dataset.fileboxId=f.id;
            div.ondragstart= handleFileBoxDragStart;
            div.innerHTML=`
              <div class="item-icon"><i class="fa-solid fa-box-archive"></i></div>
              <div class="item-info">
                <div class="item-title">${f.name}</div>
                <div class="item-meta">
                  <span class="meta-text">${f.description||''}</span>
                  ${formatLabels(f.labels||[])}
                </div>
              </div>
            `;
            ctn.appendChild(div);
        });
    }
    function handleFileBoxDragStart(e){
        const fbId= e.currentTarget.dataset.fileboxId;
        e.dataTransfer.setData('text/plain', fbId);
    }
    window.handleFileBoxDrop=function(ev){
        ev.preventDefault();
        const fbId= ev.dataTransfer.getData('text/plain');
        if(!fbId|| !activeJourneyId)return;
        const item= db.fileBox.find(x=>x.id===fbId);
        if(!item)return;
        const doc={
            id: generateId('d'),
            name: item.name,
            description: item.description,
            added: new Date().toISOString(),
            addedBy: currentUser.name,
            labels: [...(item.labels||[])],
            comments:[]
        };
        db.journeys[activeJourneyId].documents.push(doc);
        logActivity(activeJourneyId, `Added document from FileBox: ${item.name}`);
        applyFiltersAndRerender();
    };
    function handleAddFileBoxClick(){
        document.getElementById('filebox-modal-title').textContent="Add File";
        document.getElementById('edit-filebox-id').value="";
        document.getElementById('filebox-name').value="";
        document.getElementById('filebox-description').value="";
        document.getElementById('filebox-labels').value="";
        showModal(fileboxModal);
    }
    function handleEditFileBoxClick(fid){
        const f= db.fileBox.find(x=>x.id===fid);
        if(!f)return;
        document.getElementById('filebox-modal-title').textContent="Edit File";
        document.getElementById('edit-filebox-id').value=f.id;
        document.getElementById('filebox-name').value=f.name;
        document.getElementById('filebox-description').value=f.description;
        document.getElementById('filebox-labels').value=(f.labels||[]).join(', ');
        showModal(fileboxModal);
    }
    document.getElementById('save-filebox-btn').onclick=()=>{
        const editId= document.getElementById('edit-filebox-id').value;
        const nm= document.getElementById('filebox-name').value.trim();
        if(!nm){
            alert("File name required.");
            return;
        }
        const desc= document.getElementById('filebox-description').value.trim();
        const lbs= parseLabels(document.getElementById('filebox-labels').value);
        if(editId){
            const i= db.fileBox.findIndex(x=>x.id===editId);
            if(i>-1){
                db.fileBox[i].name=nm;
                db.fileBox[i].description=desc;
                db.fileBox[i].labels=lbs;
            }
        } else {
            db.fileBox.push({
                id: generateId('fb'),
                name:nm,
                description:desc,
                labels:lbs
            });
        }
        hideModal(fileboxModal);
        if(currentView==='filebox') renderFileBox();
        if(currentView==='journey-detail') renderJourneyDetailFileBox();
    };

    // Settings
    function renderSettings(){
        milestonesEl.value= (db.settings.defaultMilestones||[]).join(', ');
        rolesEl.value= (db.settings.defaultRoles||[]).join(', ');
        renderTemplates();
    }
    function renderTemplates(){
        if(!templateEntriesContainer)return;
        templateEntriesContainer.innerHTML='';
        const phases = db.settings.defaultMilestones || defaultPhases;
        db.settings.templates.forEach((tm,i)=>{
            const dv= document.createElement('div');
            dv.className='mb-2';
            dv.innerHTML=`
              <div style="border:1px solid #ddd; padding:10px; border-radius:4px; margin-bottom:5px;">
                <label style="font-size:13px;">Template Name</label>
                <input type="text" class="form-control form-control-sm template-name" data-idx="${i}" value="${tm.name}" style="margin-bottom:6px;">
                <label style="font-size:13px;">Type</label>
                <select class="form-control form-control-sm template-type" data-idx="${i}" style="margin-bottom:6px;">
                  <option value="task" ${tm.type==='task'?'selected':''}>Single Task</option>
                  <option value="checklist" ${tm.type==='checklist'?'selected':''}>Checklist</option>
                </select>
                <label style="font-size:13px;">Phase</label>
                <select class="form-control form-control-sm template-phase" data-idx="${i}" style="margin-bottom:6px;">
                  ${phases.map((ph,pi)=>`<option value="${pi}" ${tm.phaseIndex===pi?'selected':''}>${ph}</option>`).join('')}
                </select>
                <label style="font-size:13px;">Content</label>
                <textarea class="form-control form-control-sm template-content" rows="2" data-idx="${i}" style="margin-bottom:6px;">${tm.content}</textarea>
                <button class="btn btn-sm btn-outline-danger remove-template-btn" data-index="${i}">
                  <i class="fa-solid fa-trash"></i>
                </button>
              </div>
            `;
            templateEntriesContainer.appendChild(dv);
        });
        templateEntriesContainer.querySelectorAll('.remove-template-btn').forEach(btn=>{
            btn.onclick= e=>{
                const idx= parseInt(e.currentTarget.dataset.index);
                db.settings.templates.splice(idx,1);
                renderTemplates();
            };
        });
        templateEntriesContainer.querySelectorAll('.template-name').forEach(inp=>{
            inp.onblur= e=>{
                const i= parseInt(e.target.dataset.idx);
                db.settings.templates[i].name= e.target.value.trim();
            };
        });
        templateEntriesContainer.querySelectorAll('.template-type').forEach(sel=>{
            sel.onchange= e=>{
                const i= parseInt(e.target.dataset.idx);
                db.settings.templates[i].type= e.target.value;
            };
        });
        templateEntriesContainer.querySelectorAll('.template-phase').forEach(sel=>{
            sel.onchange=e=>{
                const i=parseInt(e.target.dataset.idx);
                db.settings.templates[i].phaseIndex=parseInt(e.target.value);
            };
        });
        templateEntriesContainer.querySelectorAll('.template-content').forEach(txt=>{
            txt.onblur=e=>{
                const i= parseInt(e.target.dataset.idx);
                db.settings.templates[i].content= e.target.value;
            };
        });
    }
    if(addTemplateBtn){
        addTemplateBtn.onclick=()=>{
            const newT={
                id: generateId('tmpl'),
                name:"New Template",
                type:"task",
                phaseIndex:0,
                content:""
            };
            db.settings.templates.push(newT);
            renderTemplates();
        };
    }
    if(milestonesEl){
        milestonesEl.onchange=()=>{
            db.settings.defaultMilestones= milestonesEl.value.split(',').map(x=>x.trim()).filter(x=>x);
        };
    }
    if(rolesEl){
        rolesEl.onchange=()=>{
            db.settings.defaultRoles= rolesEl.value.split(',').map(x=>x.trim()).filter(x=>x);
        };
    }

    // Tag Input
    function setupTagInput(containerId, values){
        const c= document.getElementById(containerId);
        if(!c) return;
        c.querySelectorAll('.tag-item').forEach(n=>n.remove());
        let input= c.querySelector('input')|| document.createElement('input');
        if(!c.querySelector('input')) c.appendChild(input);
        input.value='';
        values.forEach(v=> addTag(c,input,v));
        const clone= input.cloneNode(true);
        c.replaceChild(clone, input);
        input= clone;
        input.onkeydown= e=>{
            if((e.key==='Enter'|| e.key==='Tab')&& input.value.trim()){
                e.preventDefault();
                addTag(c,input,input.value.trim());
                input.value='';
            } else if(e.key==='Backspace' && !input.value){
                const lastTag= c.querySelector('.tag-item:last-of-type');
                if(lastTag) lastTag.remove();
            }
        };
        input.onblur= ()=>{
            if(input.value.trim()){
                addTag(c,input,input.value.trim());
                input.value='';
            }
        };
        c.onclick= ev=>{
            if(ev.target.classList.contains('remove-tag')){
                ev.target.closest('.tag-item').remove();
            }
        };
    }
    function addTag(container, input, text){
        const existing= getTagsFromInput(container.id);
        if(existing.includes(text)){
            input.value='';
            return;
        }
        const sp= document.createElement('span');
        sp.className='tag-item';
        sp.textContent=text;
        const rm= document.createElement('span');
        rm.className='remove-tag';
        rm.innerHTML='&times;';
        rm.title='Remove tag';
        sp.appendChild(rm);
        container.insertBefore(sp,input);
    }
    function getTagsFromInput(containerId){
        const c= document.getElementById(containerId);
        if(!c)return[];
        const arr=[];
        c.querySelectorAll('.tag-item').forEach(t=>{
            arr.push(t.firstChild.textContent);
        });
        return arr;
    }

    // Closing modals if click outside
    document.querySelectorAll('[data-dismiss="modal"]').forEach(btn=>{
        btn.onclick=()=> hideModal(btn.closest('.modal-backdrop'));
    });
    document.querySelectorAll('.modal-backdrop').forEach(m=>{
        m.onclick= e=>{
            if(e.target===m) hideModal(m);
        };
    });

    // INIT
    renderJourneyOverview();
    updateHeader();
    updateNav();
});

// END script.js