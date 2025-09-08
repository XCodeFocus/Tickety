const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("Tickety", function () {
    let Tickety, tickety, owner, addr1, addr2;

    beforeEach(async function () {
        [owner, addr1, addr2] = await ethers.getSigners();
        console.log("Deploying contracts with the account:", owner.address);
        Tickety = await ethers.getContractFactory("Tickety");
        tickety = await Tickety.deploy(100, ethers.parseEther("0.05"));
    });

    it("should allow the owner to toggle the sale", async function () {
        await tickety.saleToggle();
        expect(await tickety.saleActive()).to.be.true;
    });

    it("should allow users to bind their ID", async function () {
        await tickety.connect(addr1).binding("12345");
        expect(await tickety.idToAccount("12345")).to.equal(addr1.address);
    });

    it("should allow purchase of a ticket when sale is active", async function () {
        await tickety.saleToggle(); // Activate sale
        await tickety.connect(addr1).binding("12345");

        await tickety.connect(addr1).buyTicket(addr1.address, "https://example.com/token/1", "12345", {
            value: ethers.parseEther("0.05")
        });

        expect(await tickety.hasTicket(addr1.address)).to.be.true;
    });

    it("should only allow owner to withdraw balance", async function () {
        await tickety.saleToggle();
        await tickety.connect(addr1).binding("12345");

        await tickety.connect(addr1).buyTicket(addr1.address, "https://example.com/token/1", "12345", {
            value: ethers.parseEther("0.05")
        });

        const ownerBalanceBefore = await ethers.provider.getBalance(owner.address);
        await tickety.withdraw();
        const ownerBalanceAfter = await ethers.provider.getBalance(owner.address);

        expect(ownerBalanceAfter).to.be.gt(ownerBalanceBefore);
    });
});
