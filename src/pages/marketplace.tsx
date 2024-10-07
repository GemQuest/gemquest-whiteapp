import { useState, useEffect, useCallback } from "react";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import Header from "../components/Header";
import Loader from "../components/Loader";
import { useRouter } from "next/router";
import RPC from "../services/solanaRPC";
import QRCode from "react-qr-code";
import { ipfsGateway, gemAddresses, gemTypes } from "../utils";
import { PublicKey } from "@solana/web3.js";
import Logout from "../components/Logout";
import TicketManager from "../components/TicketManager";
import { useTheme } from "../lib/ThemeContext";

interface LoginProps {
  login: () => Promise<void>;
  logout: () => Promise<void>;
  loggedIn: boolean;
  provider: any;
  rpc: RPC | null;
}

interface Nft {
  metadata: any;
  address: string;
  name: string;
  image: string;
  symbol?: string;
  description?: string;
  properties?: {
    gem_cost?: number;
  };
}

interface GemApproval {
  [key: number]: number;
  [refund: string]: number;
}

interface Receipt {
  name: string;
  image: string;
  description: string;
  mintTimestamp: number | null;
  mint: string;
}

type ApprovedGems = {
  [key: number]: bigint;
};

const Marketplace: React.FC<LoginProps> = ({
  logout,
  loggedIn,
  provider,
  rpc,
}) => {
  const router = useRouter();
  const { setIsInQuiz, setIsAdmin } = useTheme();
  const [totalGems, setTotalGems] = useState(0);
  const [error, setError] = useState("");
  const [isModalOpen, setIsModalOpen] = useState(true);
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
  const [isCollectionModalOpen, setIsCollectionModalOpen] = useState(false);
  const [selectedNft, setSelectedNft] = useState<Nft | null>(null);
  const [loader, setLoader] = useState(false);
  const [userGems, setUserGems] = useState<{
    [key: string]: number;
  }>({
    gem1: 0,
    gem5: 0,
    gem10: 0,
    gem20: 0,
  });
  const [gemsMetadata, setGemsMetadata] = useState<{
    gem1?: any;
    gem5?: any;
    gem10?: any;
    gem20?: any;
    [key: string]: any;
  }>({});
  const [nftByUser, setNftByUser] = useState<{
    [key: string]: number;
  }>({});

  const [nftMetadata, setNftMetadata] = useState<
    | {
        [key: string]: any;
      }
    | undefined
  >(undefined);

  const [isRewardsModalOpen, setIsRewardsModalOpen] = useState(false);

  const [isTicketManagerOpen, setIsTicketManagerOpen] = useState(false);

  const [isQrModalOpen, setIsQrModalOpen] = useState(false);

  const [qrData, setQrData] = useState<{
    userWallet: string;
    nftMintAddress: string;
  } | null>(null);

  const [receipts, setReceipts] = useState<Receipt[]>([]);

  const [isReceiptsModalOpen, setIsReceiptsModalOpen] = useState(false);

  const openReceiptsModal = () => {
    setIsReceiptsModalOpen(true);
  };

  const closeReceiptsModal = () => {
    setIsReceiptsModalOpen(false);
  };

  const openRewardsModal = () => {
    setIsRewardsModalOpen(true);
  };

  const closeRewardsModal = () => {
    setIsRewardsModalOpen(false);
  };

  const openCollectionModal = () => {
    setIsCollectionModalOpen(true);
  };
  const closeCollectionModal = () => {
    setIsCollectionModalOpen(false);
  };

  useEffect(() => {
    (async () => {
      if (loggedIn && provider) {
        fetchData();
      } else {
        resetData();
        await logout();
        router.push("/");
      }
    })();
  }, [loggedIn, provider]);

  const fetchData = useCallback(async () => {
    setLoader(true);
    try {
      //const rpc = new RPC(provider);
      const [gems, nftMetadata, gemsMetadata, nftByUser, fetchedReceipts] =
        await Promise.all([
          rpc?.fetchGems(),
          rpc?.fetchNFT(),
          rpc?.fetchGemsMetadata(),
          rpc?.fetchNFTByUser(),
          rpc?.fetchReceipt(),
        ]);

      if (gems) {
        setUserGems(gems);
      }
      setTotalGems(
        (gems?.gem1 ?? 0) * 1 +
          (gems?.gem5 ?? 0) * 5 +
          (gems?.gem10 ?? 0) * 10 +
          (gems?.gem20 ?? 0) * 20
      );
      setNftMetadata(nftMetadata);
      setGemsMetadata(gemsMetadata || {});
      setNftByUser(nftByUser || {});
      setReceipts(fetchedReceipts || []);
      // console.table({ gems, nftMetadata, gemsMetadata, nftByUser,userTickets,ticketPrice });
    } catch (err) {
      setError("Failed to fetch data");
      console.error(err);
    } finally {
      setLoader(false);
    }
  }, [provider]);

  const resetData = () => {
    setIsAdmin(false);
    setUserGems({
      gem1: 0,
      gem5: 0,
      gem10: 0,
      gem20: 0,
    });
    setNftMetadata({});
    setGemsMetadata({
      gem1: {},
      gem5: {},
      gem10: {},
      gem20: {},
    });
    setTotalGems(0);
  };

  const closeModal = () => {
    setIsModalOpen(false);
  };

  const openDetailModal = (nft: any) => {
    console.log(nft);
    setSelectedNft(nft);
    setIsDetailModalOpen(true);
  };

  const closeDetailModal = () => {
    setSelectedNft(null);
    setIsDetailModalOpen(false);
  };

  const checkAllowance = async (userWallet: string): Promise<ApprovedGems> => {
    let fetch: ApprovedGems = {};
    const fetching = gemTypes.map(async (gemType) => {
      const mintAddress = new PublicKey(
        gemAddresses[gemType.value as 1 | 5 | 10 | 20]
      );
      try {
        const res = await rpc?.checkApproveToken(
          new PublicKey(userWallet),
          mintAddress
        );
        console.log(
          "Allowance for",
          gemAddresses[gemType.value as 1 | 5 | 10 | 20],
          res
        );
        fetch = { ...fetch, [gemType.value]: res } as ApprovedGems;
      } catch (error) {
        console.error(
          `Error checking approval for ${
            gemAddresses[gemType.value as 1 | 5 | 10 | 20]
          }:`,
          error
        );
        fetch = { ...fetch, [gemType.value]: 0n }; // Default to 0 if there is an error
      }
    });
    await Promise.all(fetching);
    console.log(fetch);
    return fetch;
  };

  const checkRewardAllowance = async (
    userWallet: string,
    mintAddress: string
  ) => {
    const address = new PublicKey(mintAddress);
    try {
      const res = await rpc?.checkApproveToken(
        new PublicKey(userWallet),
        address
      );
      console.log("Allowance for", mintAddress, res);
      return res;
    } catch (error) {
      console.error(`Error checking approval for ${mintAddress}:`, error);
      return 0n; // Default to 0 if there is an error
    }
  };

  const approveRequiredGems = async (
    userWallet: string,
    gemCost: number
  ): Promise<GemApproval> => {
    gemCost = Math.ceil(gemCost);

    let approvedGems = await checkAllowance(userWallet);

    const totalGemValue = gemTypes.reduce(
      (acc: number, gemType: { type: string | number; value: number }) =>
        acc + Math.floor(userGems[gemType.type]) * gemType.value,
      0
    );

    if (totalGemValue < gemCost) {
      throw new Error("Not enough gems to cover the cost");
    }

    const gemsToApprove: GemApproval = {};
    let remainingCost = gemCost;

    // Sort gemTypes by value in descending order
    gemTypes.sort((a, b) => b.value - a.value);

    // First pass: try to pay with exact amounts using larger denominations first
    for (const gemType of gemTypes) {
      const availableGems = Math.floor(userGems[gemType.type]);
      const gemsNeeded = Math.floor(remainingCost / gemType.value);
      const gemsToUse = Math.min(gemsNeeded, availableGems);

      if (gemsToUse > 0) {
        gemsToApprove[gemType.value] = gemsToUse;
        remainingCost -= gemsToUse * gemType.value;
      }

      if (remainingCost === 0) break;
    }

    // If we couldn't pay exactly, use the next larger denomination
    if (remainingCost > 0) {
      for (const gemType of gemTypes) {
        const availableGems = Math.floor(userGems[gemType.type]);
        const gemsAlreadyUsed = gemsToApprove[gemType.value] || 0;

        if (availableGems > gemsAlreadyUsed) {
          gemsToApprove[gemType.value] =
            (gemsToApprove[gemType.value] || 0) + 1;
          remainingCost = 0;
          break;
        }
      }
    }

    if (remainingCost > 0) {
      throw new Error("Unable to find a valid combination of gems for payment");
    }

    // Calculate initial overpayment
    let overpayment =
      Object.entries(gemsToApprove).reduce((acc, [value, count]) => {
        return acc + parseInt(value) * count;
      }, 0) - gemCost;

    // Sort gemTypes by value in ascending order for adjustment
    gemTypes.sort((a, b) => a.value - b.value);

    // Adjust overpayment starting from smallest denomination
    for (const gemType of gemTypes) {
      const gemValue = gemType.value;
      while (gemsToApprove[gemValue] > 0 && overpayment - gemValue >= 0) {
        gemsToApprove[gemValue]--;
        overpayment -= gemValue;
      }
      if (overpayment === 0) break;
    }

    gemsToApprove.refund = overpayment;

    // Remove any zero counts
    for (const [value, count] of Object.entries(gemsToApprove)) {
      if (count === 0 && value !== "refund") {
        delete gemsToApprove[value as any as 1 | 5 | 10 | 20];
      }
    }

    // Approve the calculated gems
    for (const [gemValue, gemCount] of Object.entries(gemsToApprove)) {
      if (gemValue !== "refund" && gemCount > 0) {
        const gemPublicKey = new PublicKey(
          gemAddresses[gemValue as any as 1 | 5 | 10 | 20]
        );
        console.log(`Approving ${gemCount} gems of value ${gemValue}`);
        await rpc?.approveTokenBurn(gemCount, gemPublicKey);
      }
    }
    // reintroduce zero counts for a corrected formatted object
    for (const gemType of gemTypes) {
      if (!gemsToApprove[gemType.value]) {
        gemsToApprove[gemType.value] = 0;
      }
    }
    await fetchData();
    return gemsToApprove;
  };

  const handleBuyNFT = async (address: string) => {
    try {
      setLoader(true);
      //const rpc = new RPC(provider);
      console.log(selectedNft);
      toast.loading(`Approve burning GEMS Tokens ...`, {
        theme: "dark",
        position: "top-right",
        autoClose: 10000,
        hideProgressBar: false,
        closeOnClick: true,
        pauseOnHover: true,
        draggable: false,
        progress: undefined,
      });
      const accounts = await rpc?.getAccounts();
      const userWallet = accounts?.[0] ?? "";
      const gemCost = selectedNft?.metadata?.properties?.gem_cost;
      let burnAndRefund = {};
      if (rpc) {
        burnAndRefund = await approveRequiredGems(userWallet, gemCost);
      }
      toast.dismiss();
      toast.success(`Burn GEMS tokens approved ! \n`, {
        theme: "dark",
        position: "top-right",
        autoClose: 5000,
        hideProgressBar: false,
        closeOnClick: true,
        pauseOnHover: true,
        draggable: false,
        progress: undefined,
      });
      console.log(burnAndRefund);
      toast.loading(`Minting ${selectedNft?.metadata?.name} NFT ...`, {
        theme: "dark",
        position: "top-right",
        autoClose: 10000,
        hideProgressBar: false,
        closeOnClick: true,
        pauseOnHover: true,
        draggable: false,
        progress: undefined,
      });
      await rpc?.burnTokenTransferNFT(
        address,
        gemCost,
        burnAndRefund as GemApproval
      );
      await fetchData();
      toast.dismiss();
      toast.success(`NFT ! ${selectedNft?.metadata?.name} minted \n`, {
        theme: "dark",
        position: "top-right",
        autoClose: 5000,
        hideProgressBar: false,
        closeOnClick: true,
        pauseOnHover: true,
        draggable: false,
        progress: undefined,
      });
    } catch (error) {
      console.error(error);
      toast.dismiss();
      toast.error("Error during NFT minting", {
        theme: "dark",
        position: "top-right",
        autoClose: 5000,
        hideProgressBar: false,
        closeOnClick: true,
        pauseOnHover: true,
        draggable: false,
        progress: undefined,
      });
    } finally {
      setLoader(false);
    }
  };

  const handleBurnAllowanceNFT = async (address: string) => {
    try {
      setLoader(true);
      // const rpc = new RPC(provider);
      toast.loading(`Approve burning Reward NFT ...`, {
        theme: "dark",
        position: "top-right",
        autoClose: 10000,
        hideProgressBar: false,
        closeOnClick: true,
        pauseOnHover: true,
        draggable: false,
        progress: undefined,
      });
      const accounts = await rpc?.getAccounts();
      const userWallet = accounts ? accounts[0] : null;
      const allowance =
        rpc && userWallet !== null
          ? await checkRewardAllowance(userWallet, address)
          : null;
      console.log("Reward NFT allowance", allowance);
      if (allowance === 0n) {
        try {
          await rpc?.approveTokenBurn(1, new PublicKey(address));
          toast.dismiss();
          toast.success(`Burn Reward NFT approved ! \n`, {
            theme: "dark",
            position: "top-right",
            autoClose: 5000,
            hideProgressBar: false,
            closeOnClick: true,
            pauseOnHover: true,
            draggable: false,
            progress: undefined,
          });
        } catch (error) {
          throw new Error("Error during Reward NFT burn allowance");
        }
      }
      const qrData = {
        userWallet,
        nftMintAddress: address,
        timestamp: Date.now(),
      };
      if (qrData) {
        setIsQrModalOpen(true);
      } else {
        throw new Error("Invalid QR data");
      }
      return qrData;
    } catch (error) {
      console.error(error);
      toast.dismiss();
      toast.error("Error during Reward NFT burn allowance", {
        theme: "dark",
        position: "top-right",
        autoClose: 5000,
        hideProgressBar: false,
        closeOnClick: true,
        pauseOnHover: true,
        draggable: false,
        progress: undefined,
      });
    } finally {
      setLoader(false);
    }
  };

  const handleClickNFT = async (address: string) => {
    const data = await handleBurnAllowanceNFT(address);
    if (data) {
      setQrData(data as { userWallet: string; nftMintAddress: string });
    }
  };

  const handleCloseQrModal = () => {
    setIsQrModalOpen(false);
    setQrData(null);
  };

  useEffect(() => {
    const handlePopState = (event: PopStateEvent) => {
      event.preventDefault();
      console.log("Back button pressed");
      handleBackToHome();
    };

    window.addEventListener("popstate", handlePopState);

    return () => {
      window.removeEventListener("popstate", handlePopState);
    };
  }, []);

  const handleBackToHome = () => {
    setIsInQuiz(false);
    // Réinitialiser les états liés aux gems si nécessaire
    setTotalGems(0);
    setGemsMetadata({
      gem1: {},
      gem5: {},
      gem10: {},
      gem20: {},
    });
    setUserGems({
      gem1: 0,
      gem5: 0,
      gem10: 0,
      gem20: 0,
    });
    router.push("/");
  };

  useEffect(() => {
    setIsInQuiz(false);
  }, [setIsInQuiz]);

  return (
    <div>
      <div style={{ marginTop: "15px" }}>
        <Logout logout={logout} onBackToHome={handleBackToHome} />
      </div>
      <ToastContainer />
      <Header />

      <main>
        <div className="marketplaceContainer">
          <div className="marketplaceContent">
            {error && (
              <span className="animate__animated animate__zoomInLeft">
                {error}
              </span>
            )}

            {loader && <Loader loadingMsg={undefined} styling={undefined} />}

            {loggedIn && !loader && (
              <>
                {isQrModalOpen && (
                  <div className="qr-code-container">
                    <QRCode value={JSON.stringify(qrData)} />
                    <button
                      className="btnSubmit"
                      type="button"
                      style={{ marginTop: "30px" }}
                      onClick={handleCloseQrModal}
                    >
                      Close or Cancel
                    </button>
                  </div>
                )}
                <div>
                  <h3
                    className="modalContentNft"
                    style={{
                      fontFamily: "Final Frontier",
                      width: "350px",
                      fontSize: "1.5rem",
                      margin: "0 auto",
                      marginTop: "10px",
                    }}
                  >
                    Welcome to the Marketplace !
                  </h3>
                  <hr style={{ paddingTop: "10px" }} />
                  <div className="gemsContainer">
                    {userGems?.gem1 > 0 && (
                      <div className="gemItem">
                        <img
                          src={gemsMetadata?.gem1?.image?.replace(
                            "ipfs://",
                            ipfsGateway
                          )}
                          alt="Gem 1"
                          className="gemImage"
                        />
                        <div className="gemCount">{userGems?.gem1}</div>
                      </div>
                    )}
                    {userGems?.gem5 > 0 && (
                      <div className="gemItem">
                        <img
                          src={gemsMetadata?.gem5?.image?.replace(
                            "ipfs://",
                            ipfsGateway
                          )}
                          alt="Gem 5"
                          className="gemImage"
                        />
                        <div className="gemCount">{userGems?.gem5}</div>
                      </div>
                    )}
                    {userGems?.gem10 > 0 && (
                      <div className="gemItem">
                        <img
                          src={gemsMetadata?.gem10?.image?.replace(
                            "ipfs://",
                            ipfsGateway
                          )}
                          alt="Gem 10"
                          className="gemImage"
                        />
                        <div className="gemCount">{userGems?.gem10}</div>
                      </div>
                    )}
                    {userGems?.gem20 > 0 && (
                      <div className="gemItem">
                        <img
                          src={gemsMetadata?.gem20?.image?.replace(
                            "ipfs://",
                            ipfsGateway
                          )}
                          alt="Gem 20"
                          className="gemImage"
                        />
                        <div className="gemCount">{userGems?.gem20}</div>
                      </div>
                    )}
                  </div>

                  <div className="totalGems">
                    <span>💎 {totalGems} GEMS 💎 </span>
                  </div>
                  <hr />
                  <div style={{ paddingTop: "10px" }} />
                  <p
                    className="modalContentNft"
                    style={{
                      fontFamily: "Final Frontier",
                      color: "orangered",
                      width: "350px",
                      fontSize: "1.4rem",
                      margin: "0 auto",
                      cursor: "pointer",
                      marginBottom: "10px",
                      background: "rgba(0,0,0,0.3)",
                    }}
                    onClick={openRewardsModal}
                  >
                    Redeem 💎 for rewards
                  </p>
                  <div style={{ paddingTop: "20px" }} />
                  <p
                    className="modalContentNft"
                    style={{
                      fontFamily: "Final Frontier",
                      color: "orangered",
                      width: "350px",
                      fontSize: "1.4rem",
                      margin: "0 auto",
                      cursor: "pointer",
                      marginBottom: "10px",
                      background: "rgba(0,0,0,0.3)",
                    }}
                    onClick={openCollectionModal}
                  >
                    Your collection
                  </p>
                  <div style={{ paddingTop: "20px" }} />
                  <p
                    className="modalContentNft"
                    style={{
                      fontFamily: "Final Frontier",
                      color: "orangered",
                      width: "350px",
                      fontSize: "1.4rem",
                      margin: "0 auto",
                      cursor: "pointer",
                      marginBottom: "10px",
                      background: "rgba(0,0,0,0.3)",
                    }}
                    onClick={openReceiptsModal}
                  >
                    View Receipts
                  </p>
                  <div style={{ paddingTop: "20px" }} />
                  <p
                    className="modalContentNft"
                    style={{
                      fontFamily: "Final Frontier",
                      color: "orangered",
                      width: "350px",
                      fontSize: "1.4rem",
                      margin: "0 auto",
                      cursor: "pointer",
                      marginBottom: "10px",
                      background: "rgba(0,0,0,0.3)",
                    }}
                    onClick={() => setIsTicketManagerOpen(true)}
                  >
                    Manage Tickets
                  </p>
                </div>
              </>
            )}
          </div>

          {isModalOpen && loggedIn && (
            <>
              <div className="overlay"></div>
              <div className="engage" style={{ maxHeight: "300px" }}>
                <div className="rules" style={{ marginTop: "30px" }}>
                  <p>
                    <span
                      style={{
                        display: "block",
                        fontFamily: "Final Frontier",
                        fontSize: "1.5rem",
                        color: "skyblue",
                        marginBottom: "15px",
                      }}
                    >
                      Welcome to the Marketplace !
                    </span>
                    <br />
                    Here you can exchange your Gems 💎 for NFTs. <br />
                    Each NFT can be exchanged for free stuffs in the park
                  </p>
                </div>
                <button
                  className="btnSubmit"
                  type="button"
                  style={{ marginTop: "30px" }}
                  onClick={closeModal}
                >
                  Close
                </button>
              </div>
            </>
          )}
          {isRewardsModalOpen && loggedIn && (
            <div className="modalnft">
              <div className="modalContentNft">
                <div>
                  <h4 style={{ textAlign: "center", margin: "5px" }}>
                    Exchange those in green ! <br />
                    You have {totalGems} gems
                  </h4>
                </div>
                <hr />
                <div className="rewardsContainer">
                  {Object.keys(nftMetadata as object).map((key) => (
                    <div
                      key={key}
                      className="rewardItem"
                      style={{ cursor: "pointer" }}
                      onClick={() =>
                        nftMetadata && openDetailModal(nftMetadata[key])
                      }
                    >
                      <img
                        src={nftMetadata?.[key]?.metadata?.image?.replace(
                          "ipfs://",
                          ipfsGateway
                        )}
                        alt={nftMetadata?.[key]?.metadata?.name}
                        className={`rewardImage ${
                          nftMetadata?.[key]?.metadata?.properties?.gem_cost &&
                          Number(
                            nftMetadata[key]?.metadata?.properties?.gem_cost
                          ) <= totalGems
                            ? "green"
                            : "red"
                        }`}
                      />
                      <h3>{nftMetadata?.[key]?.metadata?.name}</h3>
                      <h3>
                        {nftMetadata?.[key]?.metadata?.properties?.gem_cost} 💎
                      </h3>
                    </div>
                  ))}
                </div>
                <button
                  className="btnResult success"
                  onClick={closeRewardsModal}
                >
                  Close
                </button>
              </div>
            </div>
          )}
          {isReceiptsModalOpen && loggedIn && (
            <div className="modalnft">
              <div className="modalContentNft">
                <div>
                  <h4 style={{ textAlign: "center", margin: "5px" }}>
                    Your Receipts
                  </h4>
                </div>
                <hr />
                <div className="rewardsContainer">
                  {receipts.map((receipt, index) => (
                    <div key={index} className="rewardItem">
                      <img
                        src={receipt.image}
                        alt={receipt.name}
                        className="rewardImage"
                      />
                      <h3>{receipt.name}</h3>
                      <p style={{ color: "orangered" }}>
                        {new Date(receipt.mintTimestamp || 0).toLocaleString()}
                      </p>
                    </div>
                  ))}
                </div>
                <button
                  className="btnResult success"
                  onClick={closeReceiptsModal}
                >
                  Close
                </button>
              </div>
            </div>
          )}
          {isDetailModalOpen && selectedNft && loggedIn && (
            <div className="modalnft">
              <div className="modalContentNft">
                <img
                  src={selectedNft?.metadata?.image?.replace(
                    "ipfs://",
                    ipfsGateway
                  )}
                  alt={selectedNft?.metadata?.name}
                  style={{
                    width: "85%",
                    height: "auto",
                    borderRadius: "10px",
                    boxShadow: "0 0 5px 8px #000",
                  }}
                />
                <h2>{selectedNft?.metadata?.name}</h2>
                <p>Symbol: {selectedNft?.metadata?.symbol}</p>
                <p>{selectedNft?.metadata?.description}</p>
                <p>Cost: {selectedNft?.metadata?.properties?.gem_cost} 💎</p>
                <p>
                  <button
                    className="btnResult success"
                    style={{
                      fontFamily: "Final Frontier",
                      marginTop: "10px",
                    }}
                    disabled={
                      loader ||
                      totalGems <
                        Number(selectedNft?.metadata?.properties?.gem_cost)
                    }
                    onClick={() => handleBuyNFT(selectedNft?.address)}
                  >
                    💎 Buy NFT ! 💎
                  </button>
                </p>
                <button
                  className="btnResult"
                  style={{
                    fontFamily: "Final Frontier",
                    fontSize: "0.8rem",
                    marginTop: "10px",
                  }}
                  onClick={closeDetailModal}
                >
                  Close
                </button>
              </div>
            </div>
          )}
          {isCollectionModalOpen && loggedIn && (
            <div className="modalnft">
              <div className="modalContentNft">
                <div>
                  <h4 style={{ textAlign: "center", margin: "5px" }}>
                    Check your rewards collection
                  </h4>
                </div>
                <hr />

                <div className="rewardsContainer">
                  {Object.keys(nftMetadata as Object).map(
                    (key) =>
                      nftByUser[nftMetadata?.[key]?.metadata?.symbol] > 0 && (
                        <div key={key} className="rewardItem">
                          <img
                            src={nftMetadata?.[key]?.metadata?.image?.replace(
                              "ipfs://",
                              ipfsGateway
                            )}
                            alt={nftMetadata?.[key]?.metadata?.name}
                            className={`rewardImage blue`}
                            onClick={() =>
                              handleClickNFT(nftMetadata?.[key]?.address)
                            }
                            style={{ cursor: "pointer" }}
                          />
                          <h3>
                            {nftMetadata?.[key]?.metadata?.name}{" "}
                            {nftByUser[nftMetadata?.[key]?.metadata?.symbol] > 1
                              ? `(x${
                                  nftByUser[
                                    nftMetadata?.[key]?.metadata?.symbol
                                  ]
                                })`
                              : ""}
                          </h3>
                        </div>
                      )
                  )}
                </div>
                <h3
                  style={{
                    textAlign: "center",
                    margin: "5px",
                    color: "orangered",
                  }}
                >
                  {Object.keys(nftByUser).some((key) => nftByUser[key] > 0)
                    ? "Click on an NFT to exchange it for the reward"
                    : "No NFT in your collection"}
                </h3>
                <hr />
                <button
                  className="btnResult success"
                  onClick={closeCollectionModal}
                >
                  Close
                </button>
              </div>
            </div>
          )}
          {isTicketManagerOpen && loggedIn && (
            <TicketManager
              onClose={() => setIsTicketManagerOpen(false)}
              rpc={rpc}
            />
          )}
        </div>
      </main>
    </div>
  );
};

export default Marketplace;
