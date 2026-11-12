/**
 * Example: quiz session with a countdown and optional repeat-wrong mode.
 *
 * This is a deliberately small, dependency-free domain model. The real app
 * adds persistence, question rendering, and exam presets on top of the same
 * primitives.
 *
 * Illustrative code only.
 */

class QuizSession {
    constructor(questions, options = {}) {
        this.questions = questions;
        this.durationSeconds = options.durationSeconds || 0;
        this.repeatWrong = Boolean(options.repeatWrong);

        this.answers = new Map();
        this.currentIndex = 0;
        this.startedAt = null;
        this.finishedAt = null;
        this.repeatPassDone = false;
    }

    start(now = Date.now()) {
        this.startedAt = now;
        return this.currentQuestion();
    }

    currentQuestion() {
        return this.questions[this.currentIndex] || null;
    }

    answer(choiceIndex, now = Date.now()) {
        const question = this.currentQuestion();
        if (!question) return null;

        const correct = choiceIndex === question.answerIndex;
        this.answers.set(question.id, { choiceIndex, correct });

        if (this.currentIndex < this.questions.length - 1) {
            this.currentIndex += 1;
            return { correct };
        }

        // Last question of the current pass. In smart mode, ask the wrong
        // questions exactly one more time before finishing.
        if (this.repeatWrong && !this.repeatPassDone) {
            this.repeatPassDone = true;
            if (this.appendWrongQuestions()) return { correct };
        }

        this.finishedAt = now;
        return { correct };
    }

    appendWrongQuestions() {
        const wrong = this.questions.filter((question) => {
            const answer = this.answers.get(question.id);
            return answer && !answer.correct;
        });

        if (wrong.length === 0) return false;

        // Previous answers are cleared so the second pass is scored fresh.
        for (const question of wrong) {
            this.answers.delete(question.id);
        }

        const firstRepeatIndex = this.questions.length;
        this.questions = [...this.questions, ...wrong];
        this.currentIndex = firstRepeatIndex;
        return true;
    }

    get remainingSeconds() {
        if (!this.durationSeconds || !this.startedAt || this.finishedAt) return null;
        const elapsed = Math.floor((Date.now() - this.startedAt) / 1000);
        return Math.max(0, this.durationSeconds - elapsed);
    }

    get score() {
        let correct = 0;
        for (const answer of this.answers.values()) {
            if (answer.correct) correct += 1;
        }
        return {
            correct,
            answered: this.answers.size,
            total: new Set(this.questions.map((question) => question.id)).size
        };
    }

    get isFinished() {
        return this.finishedAt !== null;
    }
}

module.exports = { QuizSession };
