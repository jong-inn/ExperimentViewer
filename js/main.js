$(document).ready(function () {
    const showReferences = true;
    const showGoldLabels = false;
    const pageSize = 5;
    const numEvaluators = 12;
    const numModels = 15;
    
    const evaluators = {
        1: "alpaca",
        2: "baize",
        3: "chatgpt",
        4: "cohere",
        5: "dolly",
        6: "gpt4",
        7: "instructgpt",
        8: "koala",
        9: "open_assistant",
        10: "red_pajama",
        11: "vicuna",
        12: "wizard_lm",
    }

    const models = {
        1: "alpaca",
        2: "baize",
        3: "chatgpt",
        4: "cohere",
        5: "dolly",
        6: "falcon",
        7: "gpt4",
        8: "instructgpt",
        9: "koala",
        10: "llama",
        11: "mpt",
        12: "open_assistant",
        13: "red_pajama",
        14: "vicuna",
        15: "wizard_lm",
    } 
    
    let collectedData = [];
    let currentPage = 1;
    let currentEvaluator = $("a.dropdown-item.evaluator.active").attr('id');
    let selectedModel = `all`;
    let activeTF = false;
    let selectedModels = $("input.form-check-input").filter("[checked]");
    selectedModels = Array.from(selectedModels.map((index, dom) => dom.id));
    
    const hash = window.location.hash;
    const pageRegex = /page=(\d+)/;
    if (hash && pageRegex.test(hash)) {
        const match = hash.match(pageRegex);
        currentPage = parseInt(match[1]);
    }

    function renderResults() {
        console.log(`currentEvaluator: ${currentEvaluator}`);

        const start = (currentPage - 1) * pageSize;
        const end = currentPage * pageSize;
        const currentResults = examples[currentEvaluator].slice(start, end);

        const resultContainer = $("#result-container");
        resultContainer.empty();

        currentResults.forEach((example, index) => {
            const exampleIndex = start + index;
            let exampleHtml = ``;

            if(showReferences) {
                exampleHtml += `<div class="container instruction"><div class="p-2 rounded" id="line-text">`
                exampleHtml += `<span class="badge bg-secondary text-light text-uppercase">Instruction</span><br /> `
                if(showGoldLabels) {
                    gold_label = example['gold_label'] || 'Reference';
                    exampleHtml += `<span class="badge bg-secondary text-light text-uppercase">${gold_label}</span><br /> `
                }
                exampleHtml += `${example['instruction']}</div></div>`;
                
                exampleHtml += `<div class="container reference"><div class="p-2 rounded" id="line-text">`
                exampleHtml += `<span class="badge bg-secondary text-light text-uppercase">Reference</span><br /> `
                exampleHtml += `${example['reference']}</div></div>`;
            }
            exampleHtml += `<div class="container ranking"><div class="p-2 rounded">`;
            exampleHtml += `<span class="badge bg-secondary text-light text-uppercase">Ranking</span><br /></div></div>`;

            exampleHtml += `<div class="container example">`;
            exampleHtml += `<ul class="list-group" data-example-index="${exampleIndex}">`;

            let previousRank = 1;
            let previousPoint = 0;
            for (let rank = 1; rank <= numModels; rank++) {
                let model = Object.keys(example['rankings'])[rank-1];
                let point = Object.values(example['rankings'])[rank-1];
                if (selectedModels.includes(model)) {
                    if (previousPoint == point) {
                        exampleHtml += `<li class="list-group-item" data-rank="${previousRank}" data-model="${model}">`;
                        exampleHtml += `<div class="row"><div class="col-xs-auto"><span class="rank-number badge bg-info rounded-pill text-light" id="ranker">${previousRank}</span>`;
                    } else {
                        exampleHtml += `<li class="list-group-item" data-rank="${rank}" data-model="${model}">`;
                        exampleHtml += `<div class="row"><div class="col-xs-auto"><span class="rank-number badge bg-info rounded-pill text-light" id="ranker">${rank}</span>`;
                        previousRank = rank;
                    }
                    exampleHtml += `<span class="rank-number badge bg-secondary rounded-pill text-light" id="ranker-info">${model} ( ${Math.round(point * 100 / 14)} % )</span><div>`;
                    exampleHtml += `<div class="col" id="line-text">${example[rank.toString()]}</div></li>`;
                    previousPoint = point;
                }
            }

            exampleHtml += `</ul></div>`;

            resultContainer.append(exampleHtml);
        });
    }

    function preprocessFile() {
        const currentData = examples[currentEvaluator];
        let preprocessedData = {"evaluator": currentEvaluator};
        currentData.forEach((example, index) => {
            let exampleDict = {
                "instruction": example["instruction"],
                "reference": example["reference"],
                "rankings": [],
            };

            let previousRank = 1;
            let previousPoint = 0;
            for (let rank = 1; rank <= numModels; rank++) {
                let tmpRankDict = {}
                let model = Object.keys(example['rankings'])[rank-1];
                let point = Object.values(example['rankings'])[rank-1];
                if (selectedModels.includes(model)) {
                    if (previousPoint == point){
                        tmpRankDict["rank"] = previousRank;
                    } else {
                        tmpRankDict["rank"] = rank;
                        previousRank = rank;
                    }
                    tmpRankDict["point"] = point;
                    tmpRankDict["model"] = model;
                    tmpRankDict["output"] = example[rank.toString()];

                    exampleDict["rankings"].push(tmpRankDict);
                }
                previousPoint = point;
            }
            preprocessedData[`example_${index+1}`] = exampleDict;
        });

        return preprocessedData;
    }

    function saveToFile() {
        collectedData = preprocessFile();

        const jsonData = JSON.stringify(collectedData);
        const blob = new Blob([jsonData], { type: "application/json" });
        const url = URL.createObjectURL(blob);
        const link = document.createElement("a");
        link.href = url;
        link.download = "result.json";
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    }

    function renderPagination() {
        const totalPages = Math.ceil(examples[currentEvaluator].length / pageSize);
        const pagination = $("#pagination");
        pagination.empty();

        for (let i = 1; i <= totalPages; i++) {
            const pageItem = $(`<li class="page-item"><a class="page-link" href="#page=${i}">${i}</a></li>`);
            if (i === currentPage) {
                pageItem.addClass("active");
            }
            pagination.append(pageItem);
        }

        $(".page-link").on("click", function (e) {
            e.preventDefault();
            currentPage = parseInt($(this).text());
            renderResults();
            renderPagination();
            window.location.hash = `page=${currentPage}`;
            window.scrollTo({ top: 0, behavior: 'smooth' });
        });
    }

    function renderEvaluatorMenu() {
        $("a.dropdown-item.evaluator").on("click", function (e) {
            currentEvaluator = $(this).attr("id");

            const currentEvalContainer = $("ul.list-group.current-evaluator");
            currentEvalContainer.empty();
            currentEvalContainer.append(`<li class="list-group-item"><strong>🎲 Current Evaluator: ${currentEvaluator}</strong></li>`);

            $("a.dropdown-item.evaluator.active").removeClass("active");
            $(`a.dropdown-item.evaluator#${currentEvaluator}`).addClass("active");

            renderResults();
            // renderPagination();
            window.scrollTo({ top: 0, behavior: "smooth" });
        });
    }

    function renderModelSelectorMenu() {
        let selectorHtml = (model, checked) => `
        <li>
          <a class="dropdown-item" id="${model}" href="#">
            <div class="form-check">
              <input class="form-check-input" type="checkbox" value="" ${checked} id="${model}" name="${model}">
              <label class="form-check-label" for="${model}">${model}</label>
            </div>
          </a>
        </li>`;

        const dropdownMenu = $("div.dropdown.model-selector");
        if (dropdownMenu.hasClass("show")){
            dropdownMenu.addClass("show");
            dropdownMenu.data("aria-expanded" ,"true");
            $("ul.dropdown-menu").addClass("show");
        }

        const modelSelectorMenu = $("#model-selector-menu");
        modelSelectorMenu.empty();

        if (selectedModel == 'all') {
            if (activeTF) {
                // Uncheck all boxes
                modelSelectorMenu.append(selectorHtml("all", ""));

                for (let i = 1; i <= numModels; i++) {
                    let model = models[i];
                    modelSelectorMenu.append(selectorHtml(model, ""));
                }

                selectedModels = [];
            } else {
                // Check all boxes
                modelSelectorMenu.append(selectorHtml("all", "checked"));

                for (let i = 1; i <= numModels; i++) {
                    let model = models[i];
                    modelSelectorMenu.append(selectorHtml(model, "checked"));
                }

                selectedModels = Array.from(Object.values(models));
            }
        } else {
            modelSelectorMenu.append(selectorHtml("all", ""));

            for (let i = 1; i <= numModels; i++) {
                let model = models[i];
    
                if (model == selectedModel) {
                    if (activeTF) {
                        modelSelectorMenu.append(selectorHtml(model, ""));
                        // Update selectedModels
                        selectedModels = selectedModels.filter(value => value != model);
                    } else {
                        modelSelectorMenu.append(selectorHtml(model, "checked"));
                        // Update selectedModels
                        selectedModels.push(model);
                    }
                } else {
                    if (selectedModels.includes(model)) {
                        modelSelectorMenu.append(selectorHtml(model, "checked"));
                    } else {
                        modelSelectorMenu.append(selectorHtml(model, ""));
                    }
                }
            }
        }

        $("ul#model-selector-menu>li, a.dropdown-item.model-selector, div.form-check, label.form-check-label").on("click", function (e) {
            e.stopPropagation();
        });

        $("input.form-check-input").on("click", function (e) {
            e.stopPropagation();
            selectedModel = $(this).attr("id");
            let attr = $(this).attr("checked");
            console.log(`checked: ${attr}`)
            if (typeof attr !== "undefined" && attr !== false) {
                activeTF = true;
            } else {
                activeTF = false;
            }
            renderModelSelectorMenu();
            renderResults();
            renderPagination();
        });
    }

    // function stickyHeader() {
    //     let header = $("div.container.my-2>div.row:first-child");
    //     // let sticky = header.offset().top;
        
    //     if (window.scrollY > 50) {
    //         header.addClass("sticky");
    //     } else {
    //         header.removeClass("sticky");
    //     }
    // }

    function init() {
        // window.onscroll = function() {stickyHeader()};

        renderEvaluatorMenu();
        renderModelSelectorMenu();
        renderResults();
        renderPagination();

        // Initialize event listeners for ranking and pagination...
        $("#save-button").on("click", saveToFile);
    }

    init();
});