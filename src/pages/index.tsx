"use client";

import { useState, useEffect, useRef, useCallback } from "react";
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
import { useAuth } from "../hook/useAuth";

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
    userInfos,
    setUserInfos,
    isRegistered,
    setIsRegistered
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
  const [isPasswordModalOpen, setIsPasswordModalOpen] = useState(false);
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const loginAttemptCountRef = useRef<number>(0);
  const { isInitializing, loginAttemptInProgress, resetState, initAuth } =
    useAuth();

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
        setUserInfos(null);
      } finally {
        setLoader(false);
      }
    } else {
      setBalance(null);
      setAddress(null);
      setStatus("Resistance is Futile");
      setUserInfos(null);
    }
  }, [provider, loggedIn, rpc, isSignedIn]);

  useEffect(() => {
    const verifyUser = async () => {
      if (loggedIn && userInfos?.email) {
        const result = await checkUserExistence(userInfos.email);
        if (result.exists) {
          setIsRegistered(true);
          
        } else {
          console.log("User does not exist, opening registration modal");
          setIsPasswordModalOpen(true);
        }
      }
    };

    verifyUser();
    console.log(isRegistered);
  }, [loggedIn, userInfos, isRegistered]);


  const checkUserExistence = async (email: string) => {
    try {
      console.log(`Checking user existence for email: ${email}`);
      const response = await fetch(
        `/dbapi/auth/user-by-email?email=${encodeURIComponent(email)}`,
        {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
          },
        }
      );
      console.log(`Full response URL: ${response.url}`);
      console.log(`Response status: ${response.status}`);

      if (response.ok) {
        const userData = await response.json();
        console.log("User exists in database:", userData);
        return { exists: true, data: userData };
      } else if (response.status === 404) {
        const errorData = await response.json();
        console.log("User not found:", errorData.error);
        return { exists: false, error: errorData.error };
      } else {
        const errorText = await response.text();
        console.error(
          `Unexpected error: ${response.status} ${response.statusText}`,
          errorText
        );
        throw new Error(
          `Server error: ${response.status} ${response.statusText}`
        );
      }
    } catch (error) {
      console.error("Error checking user existence:", error);
      if (error instanceof Error) {
        toast.error(`Error: ${error.message}`);
      } else {
        toast.error(
          "An unexpected error occurred while checking user existence"
        );
      }
      return { exists: false, error: "An unexpected error occurred" };
    }
  };

  const registerUser = async (
    email: string,
    username: string,
    password: string
  ) => {
    try {
    
      const response = await fetch("/dbapi/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, username, password }),
      });

      if (response.ok) {
        const userData = await response.json();
        console.log("User registered successfully:", userData);
        toast.success(
          "Registration successful! Please check your email to confirm your account."
        );
        return userData;
      } else {
        const errorData = await response.json();
        throw new Error(errorData.error || "Registration failed");
      }
    } catch (error) {
      console.error("Error during registration:", error);
      toast.error(
        `Registration failed: ${
          error instanceof Error ? error.message : "Unknown error"
        }`
      );
      return null;
    }
  };

  const validatePasswords = () => {
    if (password !== confirmPassword) {
      toast.error("Passwords do not match", {
        theme: "dark",
        position: "top-right",
        autoClose: 5000,
        hideProgressBar: false,
        closeOnClick: true,
        pauseOnHover: true,
        draggable: false,
        progress: undefined,
      });
      return false;
    }
    if (password.length < 8) {
      toast.error("Password must be at least 8 characters long", {
        theme: "dark",
        position: "top-right",
        autoClose: 5000,
        hideProgressBar: false,
        closeOnClick: true,
        pauseOnHover: true,
        draggable: false,
        progress: undefined,
      });
      return false;
    }
    return true;
  };

  const handlePasswordSubmit = async () => {
    if (!validatePasswords()) {
      return;
    }

    if (userInfos?.email && userInfos?.name) {
      const registeredUser = await registerUser(
        userInfos.email,
        userInfos.name,
        password
      );
      if (registeredUser) {
        setIsPasswordModalOpen(false);
        setIsRegistered(true);
      }
    }
  };

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
    setUserInfos(null);
    setIsRegistered(false);
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

  const copyAddress = () => {
    if (address) {
      navigator.clipboard.writeText(address)
        .then(() => {
          toast.success("Address copied to clipboard!", {
            theme: "dark",
            position: "top-right",
            autoClose: 2000,
            hideProgressBar: false,
            closeOnClick: true,
            pauseOnHover: true,
            draggable: false,
            progress: undefined,
          });
        })
        .catch(err => {
          console.error('Failed to copy: ', err);
          toast.error("Failed to copy address", {
            theme: "dark",
            position: "top-right",
            autoClose: 2000,
            hideProgressBar: false,
            closeOnClick: true,
            pauseOnHover: true,
            draggable: false,
            progress: undefined,
          });
        });
    }
  }

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
              {isPasswordModalOpen && (
                <>
                  <div className="overlay"></div>
                  <div className="engage" style={{ maxHeight: "350px" }}>
                    <div className="rules" style={{ marginBottom: "40px" }}>
                      <p>
                        Welcome to GemQuest! To complete your registration,
                        please enter a password:
                      </p>
                    </div>
                    <input
                      type="password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="Enter your password"
                      className="sci-fi-input"
                      style={{ marginBottom: "40px" }}
                    />
                    <input
                      type="password"
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      placeholder="Confirm your password"
                      className="sci-fi-input"
                      style={{ marginBottom: "40px" }}
                    />

                    <button
                      className="btnSubmit"
                      type="button"
                      onClick={handlePasswordSubmit}
                    >
                      Submit
                    </button>
                  </div>
                </>
              )}
              {loggedIn && isRegistered && (
                <div>
                  <form className="inputBox">
                    {address && (
                      <p style={{ marginTop: "10px" }}>
                        {userInfos ? userInfos?.name : formatSolanaAddress()}
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
                        {hide ? "********" : balance?.toFixed(4)}{" "}
                        <span
                          onClick={copyAddress}
                          style={{
                            color: "orangered",
                            fontSize: "1.2rem ",
                            border: "none",
                            cursor: "pointer",
                          }}
                        >
                          SOL
                        </span>
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
                  {isInitializing || loginAttemptInProgress ? (
                    <Loader loadingMsg={undefined} styling={undefined} />
                  ) : (
                    <button
                      className="btnSubmit"
                      type="button"
                      onClick={login}
                      disabled={isInitializing || loginAttemptInProgress}
                    >
                      Connect !
                    </button>
                  )}
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
