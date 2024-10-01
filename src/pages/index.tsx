"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/router";
import Loader from "../components/Loader";
import Header from "../components/Header";
import RPC from "../services/solanaRPC";
import { LAMPORTS_PER_SOL } from "@solana/web3.js";
import Camera from "../components/Camera";
import { sciFiThemes, messageToSign, qrCodeValidity } from "../utils";
import { ToastContainer, toast } from "react-toastify";
import { useTheme } from "../lib/ThemeContext";
import SciFiSelect from "../components/SciFiSelect";

interface LoginProps {
  login: () => Promise<void>;
  logout: () => Promise<void>;
  loggedIn: boolean;
  provider: any;
  rpc: RPC | null;
}

const Login: React.FC<LoginProps> = ({
  login,
  logout,
  loggedIn,
  provider,
  rpc,
}) => {
  const router = useRouter();
  const [error, setError] = useState("");
  const [status, setStatus] = useState("Resistance is Futile");
  const [loader, setLoader] = useState(false);
  const [balance, setBalance] = useState<number | null>(null);
  const [address, setAddress] = useState<string | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const {
    theme,
    setTheme,
    difficulty,
    setDifficulty,
    setIsSignedIn,
    isSignedIn,
    nftToBurn,
    ticketToActivate,
    setIsInQuiz,
    isAdmin,
    setIsAdmin,
  } = useTheme();
  const [showScanner, setShowScanner] = useState(false);
  const [hide, setHide] = useState(true);
  const [isAdminModal, setIsAdminModal] = useState(false);
  const [isScannerOpen, setIsScannerOpen] = useState(false);
  const [currentAdminAction, setCurrentAdminAction] = useState<string | null>(
    null
  );
  const [ticketPrice, setTicketPrice] = useState<number | null>(0.1);
  const [isChangingPrice, setIsChangingPrice] = useState(false);

  useEffect(() => {
    setIsInQuiz(false);
  }, [setIsInQuiz]);

  useEffect(() => {
    setIsAdmin(false);
    if (provider && loggedIn) {
      setLoader(true);
      try {
        const fetchInfos = async () => {
          const address: string = (await rpc?.getAccounts())?.[0] || "";

          if (!isSignedIn) {
            try {
              const signature = await rpc?.signMessage(messageToSign);
              if (!signature) {
                toast.error("You must sign to enjoy GemQuest", {
                  theme: "dark",
                  position: "top-right",
                  autoClose: 5000,
                  hideProgressBar: false,
                  closeOnClick: true,
                  pauseOnHover: true,
                  draggable: false,
                  progress: undefined,
                });
                handleLogout();
                return;
              } else {
                setIsSignedIn(true);
              }
            } catch (error) {
              handleLogout();
              throw new Error("An error occurred while signing message");
            }
          }
          const adminWallet = await rpc?.getAdminWallet();
          if (adminWallet?.publicKey.toBase58() === address) {
            setIsAdmin(true);
          }
          const balance = await rpc?.getBalance();
          setBalance(balance ? parseFloat(balance) / LAMPORTS_PER_SOL : null);
          setAddress(address);
          setStatus("You have been assimilated");
        };
        fetchInfos();
      } catch (error) {
        console.error(error);
        setError("An error occurred");
        setStatus("Resistance is Futile");
        setIsAdmin(false);
        setBalance(null);
        setAddress(null);
      } finally {
        setLoader(false);
      }
    } else {
      setBalance(null);
      setAddress(null);
      setStatus("Resistance is Futile");
    }
  }, [provider, loggedIn, rpc, isSignedIn]);

  const handleLogout = async () => {
    await logout();
    setIsInQuiz(false);
    setIsSignedIn(false);
    setBalance(null);
    setAddress(null);
    setStatus("Resistance is Futile");
    setIsAdmin(false);
    setTheme(undefined);
    setDifficulty("easy");
  };

  const openModal = () => {
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setShowScanner(false);
  };

  const handleScanSuccess = (data: string) => {
    if (sciFiThemes.includes(data)) {
      setIsInQuiz(true);
      router.push({
        pathname: "/welcome",
      });
    } else {
      setShowScanner(false);
      setTheme(undefined);
      setDifficulty("easy");
      toast.error("Invalid QR Code", {
        theme: "dark",
        position: "top-right",
        autoClose: 5000,
        hideProgressBar: false,
        closeOnClick: true,
        pauseOnHover: true,
        draggable: false,
        progress: undefined,
      });
    }
    setLoading(false);
  };

  const handleBurnUserNFT = async (data: string) => {
    setIsScannerOpen(false);
    if (!isAdmin) return;
    if (data && isAdmin && isSignedIn) {
      setLoading(true);
      try {
        let parsedData: {
          userWallet: string;
          nftMintAddress: string;
          timestamp: number;
        };
        try {
          parsedData = JSON.parse(data);
          if (!parsedData.userWallet || !parsedData.nftMintAddress) {
            throw new Error("Invalid data format");
          }
          if (Date.now() - parsedData.timestamp > qrCodeValidity) {
            throw new Error("QR code expired");
          }
          if (
            !/^[A-HJ-NP-Za-km-z1-9]{32,44}$/.test(parsedData.userWallet) ||
            !/^[A-HJ-NP-Za-km-z1-9]{32,44}$/.test(parsedData.nftMintAddress)
          ) {
            throw new Error("Invalid wallet or NFT address format");
          }
        } catch (parseError) {
          console.error("Error parsing QR code data:", parseError);
          toast.error("Invalid QR code format", {
            theme: "dark",
            position: "top-right",
            autoClose: 5000,
            hideProgressBar: false,
            closeOnClick: true,
            pauseOnHover: true,
            draggable: false,
            progress: undefined,
          });
          return;
        }

        toast.loading("Burning NFT...", {
          theme: "dark",
          position: "top-right",
          autoClose: 10000,
          hideProgressBar: false,
          closeOnClick: true,
          pauseOnHover: true,
          draggable: false,
          progress: undefined,
        });

        const signature = await rpc?.burnUserNFT(data);
        if (signature) {
          toast.dismiss();
          toast.success("NFT burned successfully", {
            theme: "dark",
            position: "top-right",
            autoClose: 5000,
            hideProgressBar: false,
            closeOnClick: true,
            pauseOnHover: true,
            draggable: false,
            progress: undefined,
          });

          toast.loading("Minting receipt...", {
            theme: "dark",
            position: "top-right",
            autoClose: 10000,
            hideProgressBar: false,
            closeOnClick: true,
            pauseOnHover: true,
            draggable: false,
            progress: undefined,
          });

          const receiptSignature = await rpc?.createReceipt(
            parsedData.userWallet,
            parsedData.nftMintAddress
          );
          if (receiptSignature) {
            toast.dismiss();
            toast.success("Receipt minted successfully", {
              theme: "dark",
              position: "top-right",
              autoClose: 5000,
              hideProgressBar: false,
              closeOnClick: true,
              pauseOnHover: true,
              draggable: false,
              progress: undefined,
            });
          } else {
            throw new Error("An error occurred while minting the receipt");
          }
        } else {
          throw new Error("An error occurred while burning the NFT");
        }
      } catch (error) {
        console.error(error);
        toast.dismiss();
        toast.error("An error occurred while burning the NFT", {
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
        setLoading(false);
        setCurrentAdminAction(null);
      }
    }
  };

  const handleActivateTicket = async (data: string) => {
    setIsScannerOpen(false);
    if (!isAdmin) return;
    if (data && isAdmin && isSignedIn) {
      setLoading(true);
      try {
        let parsedData: {
          mintAddress: string;
          timestamp: number;
        };
        try {
          parsedData = JSON.parse(data);
          if (!parsedData.mintAddress) {
            throw new Error("Invalid data format");
          }
          if (Date.now() - parsedData.timestamp > qrCodeValidity) {
            throw new Error("QR code expired");
          }
          if (!/^[A-HJ-NP-Za-km-z1-9]{32,44}$/.test(parsedData.mintAddress)) {
            throw new Error("Invalid wallet or NFT address format");
          }
        } catch (parseError) {
          console.error("Error parsing QR code data:", parseError);
          toast.error("Invalid QR code format", {
            theme: "dark",
            position: "top-right",
            autoClose: 5000,
            hideProgressBar: false,
            closeOnClick: true,
            pauseOnHover: true,
            draggable: false,
            progress: undefined,
          });
          return;
        }
        const ticketMint = JSON.parse(data).mintAddress;
        console.log("Ticket mint:", ticketMint);
        toast.loading("Activating ticket...", {
          theme: "dark",
          position: "top-right",
          autoClose: 10000,
        });

        const signature = await rpc?.activateTicket(ticketMint);
        console.log("Signature:", signature);
        toast.dismiss();
        toast.success("Ticket activated successfully", {
          theme: "dark",
          position: "top-right",
          autoClose: 5000,
        });
        const { status, expiration } = (await rpc?.getTicketStatus(
          ticketMint
        )) as { status: string; expiration: number };
        console.log(
          `Updated ticket status: ${status}, expiration: ${expiration}`
        );
      } catch (error) {
        console.error("Error activating ticket:", error);
        toast.dismiss();
        toast.error("Failed to activate ticket", {
          theme: "dark",
          position: "top-right",
          autoClose: 5000,
        });
      } finally {
        setLoading(false);
        setCurrentAdminAction(null);
      }
    }
  };

  const handleChangeTicketPrice = async () => {
    if (!isAdmin) return;
    if (!ticketPrice || ticketPrice <= 0) return;
    setLoading(true);
    toast.loading("Updating ticket price...", {
      theme: "dark",
      position: "top-right",
      autoClose: 10000,
    });
    try {
      setLoader(true);
      const priceInLamports = ticketPrice * LAMPORTS_PER_SOL;
      const signature = await rpc?.updateInitialPrice(priceInLamports);
      if (signature) {
        toast.dismiss();
        toast.success("Ticket price updated successfully", {
          theme: "dark",
          position: "top-right",
          autoClose: 5000,
        });
        setIsChangingPrice(false);
      } else {
        throw new Error("Failed to update ticket price");
      }
    } catch (error) {
      console.error("Error updating ticket price:", error);
      toast.error("Failed to update ticket price", {
        theme: "dark",
        position: "top-right",
        autoClose: 5000,
      });
    } finally {
      setLoading(false);
    }
  };

  const formatSolanaAddress = () => {
    if (!address) {
      return "";
    }
    if (address.length <= 10) {
      return address;
    }
    const firstPart = address.slice(0, 7);
    const lastPart = address.slice(-7);
    return `${firstPart}...${lastPart}`;
  };

  useEffect(() => {
    if (theme) {
      handleScanSuccess(theme);
    } else if (nftToBurn) {
      handleBurnUserNFT(nftToBurn);
    } else if (ticketToActivate) {
      handleActivateTicket(ticketToActivate);
    }
  }, [theme, nftToBurn, ticketToActivate]);

  return (
    <div className="signUpLoginBox">
      <ToastContainer />
      <Header />
      <main>
        <div className="slContainer">
          <div className="formBoxLeftLogin"></div>
          <div className="formBoxRight">
            <div className="formContent">
              {error !== "" && (
                <span className="animate__animated animate__zoomInLeft">
                  {error}
                </span>
              )}

              {!loader ? (
                <h2 style={{ textAlign: "center" }}>Status: {status} </h2>
              ) : (
                <Loader loadingMsg={undefined} styling={undefined} />
              )}

              {loggedIn && (
                <div>
                  <form className="inputBox">
                    {address && (
                      <p style={{ marginTop: "10px" }}>
                        {formatSolanaAddress()}
                        <br />
                        <span
                          style={{
                            color: "orangered",
                            fontSize: "1.2rem ",
                            border: "none",
                            cursor: "pointer",
                          }}
                          onClick={() => setHide(!hide)}
                        >
                          Balance:
                        </span>{" "}
                        {hide ? "********" : balance?.toFixed(4)} SOL
                      </p>
                    )}
                    <hr />
                    {loggedIn && isSignedIn && (
                      <div style={{ paddingTop: "10px" }}>
                        {address && (
                          <>
                            <div>
                              {isAdmin && (
                                <button
                                  className="btnSubmit"
                                  type="button"
                                  onClick={() => setIsAdminModal(true)}
                                  disabled={
                                    loading ||
                                    !address ||
                                    !isSignedIn ||
                                    !isAdmin
                                  }
                                >
                                  Admiral Ops
                                </button>
                              )}
                              <button
                                className="btnSubmit"
                                type="button"
                                onClick={openModal}
                                disabled={loading || !address}
                              >
                                Start a quiz !
                              </button>
                              <button
                                className="btnSubmit"
                                type="button"
                                disabled={loading || !address}
                                onClick={() => router.push("/marketplace")}
                              >
                                Reach our Marketplace !
                              </button>
                            </div>
                          </>
                        )}
                        <button
                          className="btnSubmit"
                          type="button"
                          onClick={handleLogout}
                        >
                          Logout
                        </button>
                      </div>
                    )}
                  </form>
                  {isAdmin && isAdminModal && isSignedIn && (
                    <div className="modalnft">
                      <div className="modalContentNft">
                        <h3 style={{ fontSize: "2rem" }}>Admiral Ops</h3>
                        <hr />
                        <button
                          className="btnSubmit"
                          style={{
                            fontSize: "1.2rem",
                            fontFamily: "Final Frontier",
                          }}
                          onClick={() => {
                            setIsScannerOpen(true);
                            setCurrentAdminAction("activateTicket");
                          }}
                          disabled={loading}
                        >
                          Activate a Ticket
                        </button>
                        <button
                          className="btnSubmit"
                          style={{
                            fontSize: "1.2rem",
                            fontFamily: "Final Frontier",
                          }}
                          onClick={() => {
                            setIsScannerOpen(true);
                            setCurrentAdminAction("burnUserNFT");
                          }}
                          disabled={loading}
                        >
                          Burn a NFT
                        </button>
                        <button
                          className="btnSubmit"
                          style={{
                            fontSize: "1.2rem",
                            fontFamily: "Final Frontier",
                          }}
                          onClick={() => setIsChangingPrice(true)}
                          disabled={loading}
                        >
                          Change Ticket Price
                        </button>
                        <button
                          className="btnResult success"
                          onClick={() => {
                            setIsAdminModal(false);
                          }}
                          style={{
                            fontSize: "1.2rem",
                            fontFamily: "Final Frontier",
                          }}
                        >
                          Close
                        </button>
                      </div>
                      {isScannerOpen && (
                        <>
                          <div className="overlay"></div>
                          <div
                            className="camera-container"
                            style={{
                              position: "fixed",
                              top: "70%",
                              left: "50%",
                              transform: "translate(-50%, -50%)",
                              zIndex: 10000,
                            }}
                          >
                            <Camera topic={currentAdminAction || ""} />
                            <button
                              className="btnSubmit"
                              type="button"
                              onClick={() => {
                                setIsScannerOpen(false);
                                setCurrentAdminAction(null);
                              }}
                            >
                              Close
                            </button>
                          </div>
                        </>
                      )}
                      {isChangingPrice && (
                        <>
                          <div className="overlay"></div>
                          <div className="price-change-container">
                            <input
                              type="number"
                              step="0.01"
                              min="0"
                              value={ticketPrice || ""}
                              onChange={(e) =>
                                setTicketPrice(Number(e.target.value))
                              }
                              placeholder="Enter new price in SOL"
                              className="sci-fi-input"
                            />
                            <button
                              className="btnSubmit"
                              onClick={handleChangeTicketPrice}
                              disabled={
                                ticketPrice === null ||
                                ticketPrice <= 0 ||
                                loading ||
                                !ticketPrice
                              }
                            >
                              Confirm Price Change
                            </button>
                            <button
                              className="btnSubmit"
                              onClick={() => {
                                setIsChangingPrice(false);
                                setTicketPrice(null);
                              }}
                            >
                              Cancel
                            </button>
                          </div>
                        </>
                      )}
                    </div>
                  )}
                </div>
              )}
              {!loggedIn && (
                <div>
                  <button className="btnSubmit" type="button" onClick={login}>
                    Connect !
                  </button>
                </div>
              )}
            </div>
          </div>

          {isModalOpen && (
            <>
              <div className="overlay"></div>
              <div className="engage">
                <div className="rules">
                  <p>
                    Welcome to the GemQuest Quiz ! <br />
                    <br />
                    There are 3 levels, each level has 3 questions. <br />
                    The more you answer correctly, and the more it's difficult,
                    the more you win gems ! <br />
                    <br />
                    <span style={{ color: "orangered" }}>Warning !</span>{" "}
                    Refreshing the page, going back or Logout during the quiz
                    will reset your progression ! <br />
                    <br />
                    Choose your level, then scan the QR Code:
                  </p>
                </div>
                <SciFiSelect
                  options={["easy", "intermediate", "expert"]}
                  value={difficulty}
                  onChange={(value: string) => setDifficulty(value)}
                />
                <hr />

                {!loading ? (
                  <>
                    {!showScanner ? (
                      <button
                        className="btnSubmit"
                        type="button"
                        onClick={() => setShowScanner(true)}
                        disabled={loading || !isSignedIn}
                      >
                        Scan
                      </button>
                    ) : (
                      <div className="camera-container">
                        <Camera topic="quizz" />
                      </div>
                    )}
                    <button
                      className="btnSubmit"
                      type="button"
                      onClick={closeModal}
                    >
                      I&apos;m Feared
                    </button>
                  </>
                ) : (
                  <Loader loadingMsg={undefined} styling={undefined} />
                )}
              </div>
            </>
          )}
        </div>
      </main>
    </div>
  );
};

export default Login;
