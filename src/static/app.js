document.addEventListener("DOMContentLoaded", () => {
  const activitiesList = document.getElementById("activities-list");
  const activitySelect = document.getElementById("activity");
  const signupForm = document.getElementById("signup-form");
  const messageDiv = document.getElementById("message");

  // Function to fetch activities from API
  async function fetchActivities() {
    try {
      // Avoid cached responses so UI updates show immediately after changes
      const response = await fetch(`/activities?_=${Date.now()}`);
      const activities = await response.json();

      // Clear loading message
      activitiesList.innerHTML = "";
      // Reset activity select options
      activitySelect.innerHTML = '<option value="">-- Select an activity --</option>';

      // Populate activities list
      Object.entries(activities).forEach(([name, details]) => {
        const activityCard = document.createElement("div");
        activityCard.className = "activity-card";

        const spotsLeft = details.max_participants - details.participants.length;

        let participantsHtml = "";
        if (details.participants && details.participants.length) {
          participantsHtml = `
            <div class="participants">
              <strong>Participants (${details.participants.length}):</strong>
              <ul>
                ${details.participants
                  .map(
                    (p) =>
                      `<li><span class="participant-name">${p}</span><button class="remove-participant" data-email="${p}" title="Remove participant">✖</button></li>`
                  )
                  .join("")}
              </ul>
            </div>
          `;
        } else {
          participantsHtml = `
            <div class="participants">
              <strong>Participants:</strong>
              <p class="no-participants">No participants yet</p>
            </div>
          `;
        }

        activityCard.innerHTML = `
          <h4>${name}</h4>
          <p>${details.description}</p>
          <p><strong>Schedule:</strong> ${details.schedule}</p>
          <p><strong>Availability:</strong> ${spotsLeft} spots left</p>
          ${participantsHtml}
        `;

        activitiesList.appendChild(activityCard);

        // Attach handlers to remove buttons inside this card
        const removeButtons = activityCard.querySelectorAll('.remove-participant');
        removeButtons.forEach((btn) => {
          btn.addEventListener('click', async (e) => {
            const email = btn.getAttribute('data-email');
            if (!email) return;

            // Ask for confirmation
            const ok = confirm(`Unregister ${email} from ${name}?`);
            if (!ok) return;

            try {
              const res = await fetch(
                `/activities/${encodeURIComponent(name)}/unregister?email=${encodeURIComponent(email)}`,
                { method: 'POST' }
              );
              const data = await res.json().catch(() => ({}));
              if (res.ok) {
                messageDiv.textContent = data.message || `${email} removed`;
                messageDiv.className = 'message success';
                messageDiv.classList.remove('hidden');
                // Refresh list to reflect removal
                fetchActivities();
                setTimeout(() => messageDiv.classList.add('hidden'), 4000);
              } else {
                messageDiv.textContent = data.detail || 'Failed to remove participant';
                messageDiv.className = 'message error';
                messageDiv.classList.remove('hidden');
                setTimeout(() => messageDiv.classList.add('hidden'), 4000);
              }
            } catch (err) {
              console.error('Error removing participant:', err);
              messageDiv.textContent = 'Failed to remove participant';
              messageDiv.className = 'message error';
              messageDiv.classList.remove('hidden');
              setTimeout(() => messageDiv.classList.add('hidden'), 4000);
            }
          });
        });

        // Add option to select dropdown
        const option = document.createElement("option");
        option.value = name;
        option.textContent = name;
        activitySelect.appendChild(option);
      });
    } catch (error) {
      activitiesList.innerHTML = "<p>Failed to load activities. Please try again later.</p>";
      console.error("Error fetching activities:", error);
    }
  }

  // Handle form submission
  signupForm.addEventListener("submit", async (event) => {
    event.preventDefault();

    const email = document.getElementById("email").value;
    const activity = document.getElementById("activity").value;

    try {
      const response = await fetch(
        `/activities/${encodeURIComponent(activity)}/signup?email=${encodeURIComponent(email)}`,
        {
          method: "POST",
        }
      );

      const result = await response.json();

      if (response.ok) {
        messageDiv.textContent = result.message;
        messageDiv.className = "message success";
        signupForm.reset();
        // Refresh activities so participants and availability update
        fetchActivities();
      } else {
        messageDiv.textContent = result.detail || "An error occurred";
        messageDiv.className = "message error";
      }

      messageDiv.classList.remove("hidden");

      // Hide message after 5 seconds
      setTimeout(() => {
        messageDiv.classList.add("hidden");
      }, 5000);
    } catch (error) {
      messageDiv.textContent = "Failed to sign up. Please try again.";
      messageDiv.className = "message error";
      messageDiv.classList.remove("hidden");
      console.error("Error signing up:", error);
    }
  });

  // Initialize app
  fetchActivities();
});
