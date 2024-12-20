import React, { useState, useEffect } from "react";
import Web3 from "web3";
import PolicyManagementABI from "../../abis/PolicyManagement.json";
import PremiumCollectionABI from "../../abis/PremiumCollection.json";
import NavbarAdmin from "../../components/NavbarAdmin";
import ClaimManagementABI from "../../abis/ClaimManagement.json";

const POLICY_MANAGEMENT_ADDRESS = "0xE883AAB89149fC4c6E106644692626CF88875eeB";
const PREMIUM_COLLECTION_ADDRESS = "0xAaFa8313acE9A3D1e0d13f71228826bd507c706d";
const CLAIM_MANAGEMENT_ADDRESS = "0x46e011653866841aFeaBa33C6eb9eE18E5817f96"; 

interface DashboardData {
  totalClaims: number;
  totalPoliciesCreated: number;
  poolBalance: string;
}

const AdminDashboard: React.FC = () => {
  const [dashboardData, setDashboardData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [account, setAccount] = useState<string | null>(null);

  // 🔥 Load the admin's account on page load
  useEffect(() => {
    loadAdminAccount();
  }, []);

  const loadAdminAccount = async () => {
    try {
      const web3 = new Web3(window.ethereum);
      const accounts = await web3.eth.requestAccounts();
      setAccount(accounts[0]);
      await fetchDashboardData();
    } catch (error) {
      console.error("Error connecting wallet:", error);
      setError("Please connect your MetaMask wallet to view the admin dashboard.");
    }
  };

  // 🔥 Fetch all the data for the admin dashboard
  const fetchDashboardData = async (): Promise<void> => {
    try {
      setLoading(true);
      const web3 = new Web3(window.ethereum);

      // Contract Instances
      const policyContract = new web3.eth.Contract(PolicyManagementABI.abi, POLICY_MANAGEMENT_ADDRESS);
      const premiumContract = new web3.eth.Contract(PremiumCollectionABI.abi, PREMIUM_COLLECTION_ADDRESS);
      const claimContract = new web3.eth.Contract(ClaimManagementABI.abi, CLAIM_MANAGEMENT_ADDRESS);

      // 🟢 1. Get total policies created
      const totalPoliciesCreatedRaw = await policyContract.methods.policyCount().call() as unknown as string;
      const totalPoliciesCreated = parseInt(totalPoliciesCreatedRaw);


      /* // 🟢 2. Get list of unique users (policy holders) who have purchased a policy
      const uniquePolicyHolders = new Set<string>();

      for (let i = 1; i <= totalPoliciesCreated; i++) {
        try {
          const policyHolders = await policyContract.methods.getUserSelectedPolicies(i).call() as any;
          if (Array.isArray(policyHolders[0])) {
            policyHolders[0].forEach((holder: string) => uniquePolicyHolders.add(holder));
          }
        } catch (error) {
          console.error(`Error fetching policy holder for policyID ${i}:`, error);
        }
      }

      const totalPolicyHolders = uniquePolicyHolders.size; */

      // 🟢 3. Get pool balance
      const poolBalanceInWei = await premiumContract.methods.getPoolBalance().call() as string;
      const poolBalance = web3.utils.fromWei(poolBalanceInWei, "ether");

      // 🟢 4. Get total claims from ClaimManagement contract
      const totalClaimsRaw = await claimContract.methods.claimCount().call() as string;
      const totalClaims = parseInt(totalClaimsRaw);

      setDashboardData({
        //totalPolicyHolders: totalPolicyHolders,
        totalPoliciesCreated: totalPoliciesCreated,
        totalClaims: totalClaims,
        poolBalance: poolBalance,
      });
    } catch (error: any) {
      console.error("Error fetching dashboard data:", error);
      setError("Failed to load dashboard data. Please try again later.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-100 flex flex-col items-center">
      <NavbarAdmin/>
      <div className="w-full max-w-6xl mt-8 bg-white shadow-lg p-6 rounded-lg">
        <h1 className="text-3xl font-bold text-center mb-8">Admin Dashboard</h1>

        {loading && <p>Loading dashboard data...</p>}

        {error && <p className="text-red-500">{error}</p>}

        {dashboardData && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-6">

            <div className="bg-green-500 text-white p-6 rounded-lg shadow-md">
              <h2 className="text-xl font-bold">Total Policies Created</h2>
              <p className="text-4xl font-bold mt-4">{dashboardData.totalPoliciesCreated}</p>
            </div>

            <div className="bg-yellow-500 text-white p-6 rounded-lg shadow-md">
              <h2 className="text-xl font-bold">Pool Balance (ETH)</h2>
              <p className="text-4xl font-bold mt-4">{dashboardData.poolBalance} ETH</p>
            </div>
            <div className="bg-blue-500 text-white p-6 rounded-lg shadow-md">
            <h2 className="text-xl font-bold">Total Claims</h2>
            <p className="text-4xl font-bold mt-4">{dashboardData.totalClaims}</p> {/* 🔥 Total Claims */}
            </div>

          </div>
            
        )}
      </div>
    </div>
  );
};

export default AdminDashboard;
