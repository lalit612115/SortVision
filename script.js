document.addEventListener('DOMContentLoaded', () => {
    const canvas = document.getElementById('visualizer-canvas');
    const ctx = canvas.getContext('2d');
    canvas.width = 1000;
    canvas.height = 500;

    const generateBtn = document.getElementById('generate-btn');
    const startBtn = document.getElementById('start-btn');
    const pauseBtn = document.getElementById('pause-btn');
    const nextBtn = document.getElementById('next-btn');
    const algorithmSelect = document.getElementById('algorithm-select');
    const arraySizeSlider = document.getElementById('array-size-slider');
    const speedSlider = document.getElementById('speed-slider');
    const arraySizeValueSpan = document.getElementById('array-size-value');
    const speedValueSpan = document.getElementById('speed-value');

    let array = [];
    let arraySize = parseInt(arraySizeSlider.value);
    let sortSpeed = 100;
    let isSorting = false;
    let sortGenerator = null;
    let animationInterval = null;

    // --- Utility Functions ---
    const generateNewArray = () => {
        clearInterval(animationInterval);
        isSorting = false;
        sortGenerator = null;
        array = [];
        arraySize = parseInt(arraySizeSlider.value);
        for (let i = 0; i < arraySize; i++) {
            array.push(Math.floor(Math.random() * canvas.height) + 1);
        }
        drawArray();
        toggleControls(false);
        startBtn.textContent = "Start";
    };

    const drawArray = (highlightedIndices = [], swappedIndices = [], sortedIndices = []) => {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        const barWidth = canvas.width / array.length;
        array.forEach((value, index) => {
            let color = '#3498db'; // Default color
            if (sortedIndices.includes(index)) {
                color = '#2ecc71'; // Green for sorted
            } else if (swappedIndices.includes(index)) {
                color = '#f1c40f'; // Yellow for swapped
            } else if (highlightedIndices.includes(index)) {
                color = '#e74c3c'; // Red for comparison
            }
            ctx.fillStyle = color;
            ctx.fillRect(index * barWidth, canvas.height - value, barWidth - 1, value);
        });
    };

    const toggleControls = (isSortingInProgress) => {
        isSorting = isSortingInProgress;
        generateBtn.disabled = isSortingInProgress;
        algorithmSelect.disabled = isSortingInProgress;
        arraySizeSlider.disabled = isSortingInProgress;
        speedSlider.disabled = isSortingInProgress;
        pauseBtn.disabled = !isSortingInProgress;
        nextBtn.disabled = isSortingInProgress;
        
        if (isSortingInProgress) {
            startBtn.disabled = true;
            pauseBtn.disabled = false;
        } else {
            startBtn.disabled = false;
            pauseBtn.disabled = true;
        }
    };

    // --- Sorting Algorithms (Generators) ---
    function* bubbleSort() {
        let n = array.length;
        for (let i = 0; i < n - 1; i++) {
            for (let j = 0; j < n - i - 1; j++) {
                yield { type: 'compare', indices: [j, j + 1] };
                if (array[j] > array[j + 1]) {
                    [array[j], array[j + 1]] = [array[j + 1], array[j]];
                    yield { type: 'swap', indices: [j, j + 1] };
                }
            }
        }
    }

    function* selectionSort() {
        let n = array.length;
        for (let i = 0; i < n - 1; i++) {
            let minIdx = i;
            for (let j = i + 1; j < n; j++) {
                yield { type: 'compare', indices: [i, j], extra: [minIdx] };
                if (array[j] < array[minIdx]) {
                    minIdx = j;
                }
            }
            if (minIdx !== i) {
                [array[i], array[minIdx]] = [array[minIdx], array[i]];
                yield { type: 'swap', indices: [i, minIdx] };
            }
        }
    }
    
    function* insertionSort() {
        let n = array.length;
        for (let i = 1; i < n; i++) {
            let key = array[i];
            let j = i - 1;
            while (j >= 0 && array[j] > key) {
                yield { type: 'compare', indices: [j, j + 1] };
                array[j + 1] = array[j];
                j = j - 1;
            }
            array[j + 1] = key;
            yield { type: 'insert', indices: [j + 1] };
        }
    }
    // Add other generator algorithms here

    const runStep = () => {
        if (!sortGenerator) {
            const algorithm = algorithmSelect.value;
            switch (algorithm) {
                case 'bubbleSort':
                    sortGenerator = bubbleSort();
                    break;
                case 'selectionSort':
                    sortGenerator = selectionSort();
                    break;
                case 'insertionSort':
                    sortGenerator = insertionSort();
                    break;
                // Add other algorithms here
            }
        }

        const result = sortGenerator.next();
        if (result.done) {
            clearInterval(animationInterval);
            drawArray([], [], Array.from({ length: array.length }, (_, i) => i)); // Final sorted state
            toggleControls(false);
            startBtn.textContent = "Start";
            return;
        }

        const { type, indices } = result.value;
        let highlighted = [], swapped = [];

        if (type === 'compare') {
            highlighted = indices;
        } else if (type === 'swap' || type === 'insert') {
            swapped = indices;
        }
        drawArray(highlighted, swapped);
    };

    // --- Event Listeners ---
    generateBtn.addEventListener('click', generateNewArray);
    
    startBtn.addEventListener('click', () => {
        if (isSorting) {
            clearInterval(animationInterval);
            isSorting = false;
            toggleControls(false);
            startBtn.textContent = "Resume";
            nextBtn.disabled = false;
        } else {
            animationInterval = setInterval(runStep, sortSpeed);
            isSorting = true;
            toggleControls(true);
            startBtn.textContent = "Pause";
        }
    });
    
    pauseBtn.addEventListener('click', () => {
        clearInterval(animationInterval);
        isSorting = false;
        toggleControls(false);
        startBtn.textContent = "Resume";
        startBtn.disabled = false;
        nextBtn.disabled = false;
    });

    nextBtn.addEventListener('click', () => {
        if (!isSorting) {
            runStep();
        }
    });

    arraySizeSlider.addEventListener('input', () => {
        arraySizeValueSpan.textContent = arraySizeSlider.value;
        if (!isSorting) {
            generateNewArray();
        }
    });

    speedSlider.addEventListener('input', () => {
        sortSpeed = 501 - speedSlider.value; // Invert slider for intuitive speed control
        speedValueSpan.textContent = `${sortSpeed} ms`;
        // If sorting is active, restart the interval with the new speed
        if (isSorting) {
            clearInterval(animationInterval);
            animationInterval = setInterval(runStep, sortSpeed);
        }
    });

    // Initialize on page load
    generateNewArray();
});