(() => {
    // DOM要素の取得
    const container = document.getElementById('companies');
    const startButton = document.getElementById('startButton');
    const timeDisplay = document.getElementById('timeDisplay');
    const dayDisplay = document.getElementById('dayDisplay');
    const popupMessage = document.getElementById('popupMessage');
    const popupModal = document.getElementById('popupModal');
    const overlay = document.getElementById('overlay');
    const closePopupButton = document.getElementById('closePopupButton');
    const totalStockValueDisplay = document.getElementById('totalStockValue');

    // 変数の定義
    const intervalSeconds = 2000;
    const closeHour = 15;
    const closeMinute = 30;
    let balance = 100000;
    let totalStockValue = 0;
    let stockUpdateInterval = [];
    let isMarketOpen = false;
    let currentHour = 9;
    let currentMinute = 0;
    let currentDay = 1;
    let clockInterval;
    let isFirstDay = true;

    // 会社情報
    const companies = [
        { name: "Company A", stockPrice: 1000, previousPrice: 1000, shares: 0, buyPrice: 0, totalStockValueAtBuy: 0 },
        { name: "Company B", stockPrice: 1500, previousPrice: 1500, shares: 0, buyPrice: 0, totalStockValueAtBuy: 0 },
        { name: "Company C", stockPrice: 1800, previousPrice: 1800, shares: 0, buyPrice: 0, totalStockValueAtBuy: 0 },
        { name: "Company D", stockPrice: 2000, previousPrice: 2000, shares: 0, buyPrice: 0, totalStockValueAtBuy: 0 },
    ];

    // ページに表示させる要素
    function initializeCompanies() {
        companies.forEach((company, index) => {
            const companyDiv = document.createElement('div');
            companyDiv.classList.add('company_container');
            companyDiv.innerHTML = `
                <h2>${company.name}</h2>
                <p class="stock_price" id="stockPrice-${index}">${company.stockPrice.toLocaleString()}円</p>
                <p id="stockChangeDaily-${index}">株価増減: 0円</p><hr>
                <p id="shares-${index}">保有株数: ${company.shares.toLocaleString()} 株</p>
                <p id="totalStockValue-${index}">保有株の総額: 0円</p>
                <p id="stockPriceChange-${index}">利益: 0円</p>
                <input type="number" id="shareAmount-${index}" placeholder="株数" min="1" />
                <button class="buy_button" data-index="${index}">株を購入</button>
                <button class="sell_button" data-index="${index}">株を売却</button>
            `;
            container.appendChild(companyDiv);
        });

        document.querySelectorAll('.buy_button').forEach(button => {
            button.addEventListener('click', (event) => {
                const index = event.target.getAttribute('data-index');
                buyStock(index);
            });
        });

        document.querySelectorAll('.sell_button').forEach(button => {
            button.addEventListener('click', (event) => {
                const index = event.target.getAttribute('data-index');
                sellStock(index);
            });
        });
    }
    initializeCompanies();

    // スタートボタンが押された時の処理
    document.addEventListener('DOMContentLoaded', () => {
        startButton.addEventListener('click', () => {
            if (isFirstDay) {
                isFirstDay = false;
                startClock();
                startButton.style.display = 'none';
            }
        });
    });

    // 現在日時と時刻の更新をスタートさせる関数
    function startClock() {
        isMarketOpen = true;
        closePopup();
        updateClockDisplay();
        startStockPriceUpdates();
        clockInterval = setInterval(advanceTime, intervalSeconds);
    }

    // 時刻の進行処理
    function advanceTime() {
        currentMinute += 15;
        if (currentMinute >= 60) {
            currentMinute = 0;
            currentHour++;
        }

        if (currentHour === closeHour && currentMinute === closeMinute) {
            clearInterval(clockInterval);
            isMarketOpen = false;
            stopStockPriceUpdates();
            showPopup("場外時間です。場内時間に戻るまで株価は変動しません。");
            setTimeout(startNextDay, 5000);
        }

        updateClockDisplay();
    }

    // 日時の進行処理
    function startNextDay() {
        currentHour = 9;
        currentMinute = 0;
        currentDay++;
        startClock();
        updateClockDisplay();
    }

    // 時刻と日時の表示を更新する関数
    function updateClockDisplay() {
        const formattedTime = `${('0' + currentHour).slice(-2)}:${('0' + currentMinute).slice(-2)}`;
        timeDisplay.innerText = formattedTime;
        dayDisplay.innerText = `${currentDay}日目`;
    }

    // 株価の更新をスタートさせる関数
    function startStockPriceUpdates() {
        if (isMarketOpen) {
            companies.forEach((company, index) => {
                const updateInterval = setInterval(() => updateStockPrice(company, index), intervalSeconds);
                stockUpdateInterval.push(updateInterval);
            });
        }
    }

    // 株価の更新をストップさせる関数
    function stopStockPriceUpdates() {
        stockUpdateInterval.forEach(clearInterval);
        stockUpdateInterval = [];
    }

    // 株価の更新処理
    function updateStockPrice(company, index) {
        const change = Math.floor(Math.random() * 100 - 45);
        company.stockPrice = Math.max(1, company.stockPrice + change);
        const oldPrice = company.stockPrice;
        document.getElementById(`stockPrice-${index}`).innerText = `${company.stockPrice.toLocaleString()}円`;

        const priceChange = company.stockPrice - company.previousPrice;
        document.getElementById(`stockChangeDaily-${index}`).innerText = `株価増減: ${priceChange >= 0 ? "+" : ""}${priceChange.toLocaleString()}円`;
        company.previousPrice = oldPrice;

        updateTotalStockValue(company, index);
        updateTotalAssets();
    }

    // 株の購入処理
    function buyStock(index) {
        if (!isMarketOpen) {
            showPopup("場外時間中は株を購入できません。");
            return;
        }

        const company = companies[index];
        const amount = parseInt(document.getElementById(`shareAmount-${index}`).value);
        const totalCost = amount * company.stockPrice;

        if (isNaN(amount) || amount <= 0) {
            showPopup("株数は0以上を入力して下さい。");
            return;
        }

        if (balance >= totalCost) {
            balance -= totalCost;
            company.shares += amount;
            company.buyPrice = company.stockPrice;
            company.totalStockValueAtBuy = company.shares * company.stockPrice;
            updateDisplay(index);
            showPopup(`${company.name} の株を ${amount} 株、1株 ${company.stockPrice.toLocaleString()} 円で購入しました。合計： ${totalCost.toLocaleString()} 円`);
        } else {
            showPopup("残高が足りません。");
        }
    }

    // 株の売却処理
    function sellStock(index) {
        if (!isMarketOpen) {
            showPopup("場外時間中は株を売却できません。");
            return;
        }

        const company = companies[index];
        const amount = parseInt(document.getElementById(`shareAmount-${index}`).value);
        const totalRevenue = amount * company.stockPrice;

        if (isNaN(amount) || amount <= 0) {
            showPopup("株数は0以上を入力して下さい。");
            return;
        }

        if (company.shares >= amount) {
            balance += totalRevenue;
            company.shares -= amount;
            const profit = totalRevenue - (company.buyPrice * amount);
            updateDisplay(index);
            showPopup(`${company.name} 売却株数： ${amount} 株 金額： ${totalRevenue.toLocaleString()} 円 利益： ${profit >= 0 ? "+" : ""}${profit.toLocaleString()} 円`);
        } else {
            showPopup("保有株数が足りません。");
        }
    }

    // 残高と保有株数の表示の更新
    function updateDisplay(index) {
        document.getElementById("balance").innerText = `残高： ${balance.toLocaleString()} 円`;
        document.getElementById(`shares-${index}`).innerText = `保有株数： ${companies[index].shares} 株`;
        updateTotalStockValue(companies[index], index);
        updateTotalAssets();
    }

    // 保有株の総額と利益の表示の更新
    function updateTotalStockValue(company, index) {
        const totalValue = company.shares * company.stockPrice;
        document.getElementById(`totalStockValue-${index}`).innerText = `保有株の総額： ${totalValue.toLocaleString()} 円`;
        const stockValueChange = company.shares > 0 ? totalValue - company.totalStockValueAtBuy : 0;
        document.getElementById(`stockPriceChange-${index}`).innerText = `利益： ${stockValueChange.toLocaleString()} 円`;
    }

    // 総資産の表示の更新
    function updateTotalAssets() {
        totalStockValue = companies.reduce((acc, company) => acc + company.shares * company.stockPrice, 0);
        const totalAssets = balance + totalStockValue;
        totalStockValueDisplay.innerText = `総資産： ${totalAssets.toLocaleString()} 円`;
    }

    // ポップアップの表示
    function showPopup(message) {
        popupMessage.innerText = message;
        popupModal.style.display = 'block';
        overlay.style.display = 'block';
    }

    // ポップアップの非表示
    function closePopup() {
        popupModal.style.display = 'none';
        overlay.style.display = 'none';
    }

    closePopupButton.addEventListener('click', closePopup);
})();