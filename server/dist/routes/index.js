import express from 'express';
const router = express.Router();
// Root path response
router.get("/", (req, res) => {
    res.status(200).send("Welcome to Your Website!");
});
router.get("/ping", (req, res) => {
    res.status(200).send("pong");
});
export default router;
//# sourceMappingURL=index.js.map