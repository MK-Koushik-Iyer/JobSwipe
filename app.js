document.addEventListener("DOMContentLoaded", () => {
    const jobCardContainer = document.getElementById("job-card-container");
    const rejectBtn = document.getElementById("reject-btn");
    const acceptBtn = document.getElementById("accept-btn");

    // Extended job offers data
    const jobOffers = [
        {
            title: "Software Engineer",
            company: "Microsoft",
            description: "Develop and maintain software applications.",
            logo: "images/microsoft.svg",
            salary: "$80,000 - $100,000",
            duration: "Full-time",
            skills: ["JavaScript", "React", "Node.js"]
        },
        {
            title: "Product Manager",
            company: "Google",
            description: "Lead the product development lifecycle.",
            logo: "images/google.svg",
            salary: "$90,000 - $120,000",
            duration: "Full-time",
            skills: ["Agile", "Scrum", "Leadership"]
        },
        {
            title: "UX Designer",
            company: "Uber",
            description: "Create intuitive user interfaces and experiences.",
            logo: "images/uber.svg",
            salary: "$70,000 - $90,000",
            duration: "Part-time",
            skills: ["Adobe XD", "Figma", "Sketch"]
        },
        {
            title: "Financial Analyst",
            company: "Goldman Sachs",
            description: "Analyze financial data to provide investment recommendations.",
            logo: "images/goldman.svg",
            salary: "$95,000 - $130,000",
            duration: "Full-time",
            skills: ["Excel", "Financial Modeling", "Market Analysis"]
        },
        {
            title: "Marketing Manager",
            company: "Meta",
            description: "Develop and execute marketing strategies to drive brand growth.",
            logo: "images/meta.svg",
            salary: "$110,000 - $140,000",
            duration: "Full-time",
            skills: ["Digital Marketing", "SEO", "Content Creation"]
        },
        {
            title: "Operations Coordinator",
            company: "Netflix",
            description: "Manage day-to-day operations and coordinate with various departments.",
            logo: "images/netflix.svg",
            salary: "$80,000 - $100,000",
            duration: "Full-time",
            skills: ["Project Management", "Communication", "Logistics"]
        },
        {
            title: "HR Specialist",
            company: "Amazon",
            description: "Handle recruitment, employee relations, and HR policies.",
            logo: "images/amazon.svg",
            salary: "$75,000 - $95,000",
            duration: "Full-time",
            skills: ["Recruitment", "Employee Relations", "HR Management"]
        },
        {
            title: "Consultant",
            company: "PwC",
            description: "Provide expert advice on various business challenges.",
            logo: "images/pwc.svg",
            salary: "$120,000 - $150,000",
            duration: "Full-time",
            skills: ["Consulting", "Strategic Planning", "Client Management"]
        },
        {
            title: "Audit Associate",
            company: "KPMG",
            description: "Perform audits and ensure compliance with financial regulations.",
            logo: "images/kpmg.svg",
            salary: "$70,000 - $90,000",
            duration: "Full-time",
            skills: ["Audit Procedures", "Compliance", "Financial Reporting"]
        },
        {
            title: "Business Analyst",
            company: "Deloitte",
            description: "Analyze business processes and suggest improvements.",
            logo: "images/deloitte.svg",
            salary: "$85,000 - $105,000",
            duration: "Full-time",
            skills: ["Business Analysis", "Data Interpretation", "Problem-Solving"]
        }
        // Add more job offers as needed
    ];

    let currentJobIndex = 0;

    // Render job card
    function renderJobCard(job) {
        jobCardContainer.innerHTML = `
            <div class="job-card" id="job-card">
                <img src="${job.logo}" alt="${job.company} Logo">
                <div class="job-title">${job.title}</div>
                <div class="company-name">${job.company}</div>
                <div class="job-description">${job.description}</div>
                <div class="job-details">
                    <div class="job-tag job-salary">Salary: ${job.salary}</div>
                    <div class="job-tag job-duration">Duration: ${job.duration}</div>
                    <div class="job-tag job-skills">Skills: ${job.skills.join(", ")}</div>
                </div>
                <div class="swipe-indicator like">LIKE</div>
                <div class="swipe-indicator dislike">NOPE</div>
            </div>
        `;
    }
    
    renderJobCard(jobOffers[currentJobIndex]);

    // Swipe left to reject a job
    function rejectJob() {
        const jobCard = document.getElementById("job-card");
        jobCard.style.transform = "translateX(-1000px)";
        setTimeout(() => {
            jobCard.remove();
            currentJobIndex++;
            if (currentJobIndex < jobOffers.length) {
                renderJobCard(jobOffers[currentJobIndex]);
            } else {
                displayEndMessage();
            }
        }, 300);
    }

    // Swipe right to accept a job
    function acceptJob() {
        const jobCard = document.getElementById("job-card");
        jobCard.style.transform = "translateX(1000px)";
        setTimeout(() => {
            jobCard.remove();
            currentJobIndex++;
            if (currentJobIndex < jobOffers.length) {
                renderJobCard(jobOffers[currentJobIndex]);
            } else {
                displayEndMessage();
            }
        }, 300);
    }

    // Event listeners for buttons
    rejectBtn.addEventListener("click", rejectJob);
    acceptBtn.addEventListener("click", acceptJob);

    // Display message when all job offers are swiped
    function displayEndMessage() {
        jobCardContainer.innerHTML = `
            <div class="end-message">
                <h2>No more job offers</h2>
                <p>You've swiped through all available job offers. Check back later for more opportunities!</p>
            </div>
        `;
    }
});
