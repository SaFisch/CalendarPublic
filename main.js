(function () {
  let template = document.createElement("template");
  template.innerHTML = `
    <style>
      .header {
        display: flex;
        justify-content: space-between;
        align-items: center;
        margin-bottom: 10px;
      }

      .calendar {
        display: grid;
        grid-template-columns: repeat(7, 1fr);
        grid-gap: 2px; 
        text-align: center;
      }

      .day {
        border: 1px solid #ddd; 
        display: flex;
        flex-direction: column;
        position: relative;
        height: 150px;
      }

      .day-number {
        font-weight: bold;
        font-size: 14px;
        height: 25px;
        background-color: #f0f0f0;
      }

      .event-space {
        flex-grow: 1;
        background-color: #fafafa;
        position: relative;
      }

      .event-item {
        position: absolute;
        margin: 0; 
        padding: 5px;
        background-color: #e0f7fa;
        font-size: 12px;
        height: 12px;
        text-overflow: ellipsis;
        white-space: nowrap;
      }

      select {
        padding: 5px;
        font-size: 14px;
      }
    </style>

    <div class="header">
      <select id="monthSelect">
        <option value="0">January</option>
        <option value="1">February</option>
        <option value="2">March</option>
        <option value="3">April</option>
        <option value="4">May</option>
        <option value="5">June</option>
        <option value="6">July</option>
        <option value="7">August</option>
        <option value="8">September</option>
        <option value="9">October</option>
        <option value="10">November</option>
        <option value="11">December</option>
      </select>
      <select id="yearSelect"></select>
    </div>

    <div class="calendar">
      <div class="day-header">Mon</div>
      <div class="day-header">Tue</div>
      <div class="day-header">Wed</div>
      <div class="day-header">Thu</div>
      <div class="day-header">Fri</div>
      <div class="day-header">Sat</div>
      <div class="day-header">Sun</div>
    </div>
  `;

  class ColoredBox extends HTMLElement {
    constructor() {
      super();
      let shadowRoot = this.attachShadow({ mode: "open" });
      shadowRoot.appendChild(template.content.cloneNode(true));

      this.currentYear = new Date().getFullYear();
      this.currentMonth = new Date().getMonth();

      this.render();
    }

    parseDate(dateString) {
      if (!dateString) return null;
      const [datePart, timePart] = dateString.split(" ");
      const [day, month, year] = datePart.split(".").map(Number);
      const [hours, minutes, seconds] = timePart.split(":").map(Number);

      return new Date(year, month - 1, day, hours, minutes, seconds);
    }

    async render() {
  console.log('Render-Methode aufgerufen'); // Debug-Ausgabe

  // Überprüfe den Zustand der Datenquelle
  if (!this._myDataSource || this._myDataSource.state !== "success") {
    console.log('Datenquelle ist entweder nicht vorhanden oder nicht erfolgreich geladen');
    // Zeige eine benutzerfreundliche Nachricht an
    this.showNoDataMessage();
    return;
  }

  // Die Struktur der Datenquelle überprüfen
  console.log('Datenquelle:', this._myDataSource);

  const startTimestamp = this._myDataSource.metadata.feeds.dimensions.values[0];
  const endTimestamp = this._myDataSource.metadata.feeds.dimensions.values[1];
  const event = this._myDataSource.metadata.feeds.dimensions.values[2];

  const data = this._myDataSource.data.map((dataItem) => {
    return {
      startDate: this.parseDate(dataItem[startTimestamp]),
      endDate: this.parseDate(dataItem[endTimestamp]),
      event: dataItem[event] || '',
    };
  });

  // Überprüfen, ob tatsächlich Daten vorhanden sind
  if (data.length === 0) {
    console.log('Keine Ereignisse in den Daten');
    this.showNoDataMessage();
    return;
  }

  this.events = data;
  this.renderYearOptions();
  this.renderCalendar();
}

showNoDataMessage() {
  // Beispiel für eine einfache Anzeige einer "Keine Daten"-Nachricht
  const calendar = this.shadowRoot.querySelector(".calendar");
  const noDataMessage = document.createElement("div");
  noDataMessage.textContent = "Keine Daten verfügbar";
  noDataMessage.style.textAlign = "center";
  calendar.appendChild(noDataMessage);
}


    set myDataSource(dataBinding) {
      this._myDataSource = dataBinding;
      this.render();
    }

    renderYearOptions() {
      let yearSelect = this.shadowRoot.getElementById("yearSelect");
      let currentYear = new Date().getFullYear();

      for (let i = currentYear - 50; i <= currentYear + 50; i++) {
        let option = document.createElement("option");
        option.value = i;
        option.text = i;
        if (i === currentYear) option.selected = true;
        yearSelect.appendChild(option);
      }
    }

    daysInMonth(year, month) {
      return new Date(year, month + 1, 0).getDate();
    }

    renderCalendar() {
      let calendar = this.shadowRoot.querySelector(".calendar");
      calendar.innerHTML = `
        <div class="day-header">Mon</div>
        <div class="day-header">Tue</div>
        <div class="day-header">Wed</div>
        <div class="day-header">Thu</div>
        <div class="day-header">Fri</div>
        <div class="day-header">Sat</div>
        <div class="day-header">Sun</div>
      `;

      let daysInMonth = this.daysInMonth(this.currentYear, this.currentMonth);
      let firstDayOfMonth = new Date(
        this.currentYear,
        this.currentMonth,
        1
      ).getDay();
      let adjustedFirstDay = firstDayOfMonth === 0 ? 6 : firstDayOfMonth - 1;

      for (let i = 0; i < adjustedFirstDay; i++) {
        let emptyCell = document.createElement("div");
        emptyCell.classList.add("empty-cell");
        calendar.appendChild(emptyCell);
      }

      for (let i = 1; i <= daysInMonth; i++) {
        let dayElement = document.createElement("div");
        dayElement.className = "day";

        let dayNumber = document.createElement("div");
        dayNumber.className = "day-number";
        dayNumber.textContent = i;

        let eventSpace = document.createElement("div");
        eventSpace.className = "event-space";

        let eventsForDay = this.events.filter((event) => {
          let eventStartDate = new Date(event.startDate);
          let eventEndDate = new Date(event.endDate);
          let dayDate = new Date(this.currentYear, this.currentMonth, i);
          return (
            eventStartDate <= dayDate &&
            eventEndDate >= dayDate
          );
        });

        eventsForDay.forEach((event) => {
          let eventItem = document.createElement("div");
          eventItem.className = "event-item";
          eventItem.textContent = event.event;
          eventSpace.appendChild(eventItem);
        });

        dayElement.appendChild(dayNumber);
        dayElement.appendChild(eventSpace);
        calendar.appendChild(dayElement);
      }
    }

    onCustomWidgetBeforeUpdate(changedProperties) {
      this._props = { ...this._props, ...changedProperties };
    }

    onCustomWidgetAfterUpdate(changedProperties) {
      if ("myDataSource" in changedProperties) {
        console.log("myDataSource wurde gesetzt");
        this.myDataSource = changedProperties["myDataSource"];
      }
    }
  }

  customElements.define("com-safisch-calendarpublic", ColoredBox);
})();
