
use anchor_lang::prelude::*;

declare_id!("5PhDqK5idAihN4MhbwDAHE72vgjLeUYSkdiqy6N3REbR");

pub mod instructions;

use instructions::*;

#[program]
pub mod gemquest {
    use super::*;

    pub fn initialize_program(ctx: Context<InitializeProgram>) -> Result<()> {
        instructions::initialize_program::initialize_program(ctx)
    }

    pub fn initialize_user_account(ctx: Context<InitializeUserAccount>) -> Result<()> {
        instructions::initialize_user_account::initialize_user_account(ctx)
    }

    pub fn create_token(
        ctx: Context<CreateToken>,
        token_name: String,
        token_symbol: String,
        token_uri: String,
    ) -> Result<()> {
         instructions::create_token::create_token(ctx, token_name, token_symbol, token_uri)
    }

    pub fn mint_tokens_to_user(ctx: Context<MintTokensToUser>, amount: u64) -> Result<()> {
        instructions::mint_tokens_to_user::mint_tokens_to_user(ctx, amount)
    }

    pub fn create_nft(
        ctx: Context<CreateNFT>,
        nft_name: String,
        nft_symbol: String,
        nft_uri: String,
        amount: u64,
    ) -> Result<()> {
        instructions::create_nft::create_nft(ctx, nft_name, nft_symbol, nft_uri, amount)
    }

    pub fn initialize_initial_price(ctx: Context<InitializeInitialPrice>) -> Result<()> {
        instructions::create_ticket_nft::initialize_initial_price(ctx)
    }

    pub fn update_initial_price(ctx: Context<UpdateInitialPrice>, new_price: u64) -> Result<()> {
        instructions::create_ticket_nft::update_initial_price(ctx, new_price)
    }

    pub fn get_initial_price(ctx: Context<GetInitialPrice>) -> Result<u64> {
        instructions::create_ticket_nft::get_initial_price(ctx)
    }

    pub fn initialize_collection(
        ctx: Context<InitializeCollection>,
        name: String,
        symbol: String,
        uri: String,
    ) -> Result<()> {
        instructions::create_ticket_nft::initialize_collection(ctx, name, symbol, uri)
    }

    pub fn create_ticket_nft(
        ctx: Context<CreateTicketNFT>,
        nft_name: String,
        nft_symbol: String,
        nft_uri: String,
       
    ) -> Result<()> {
        instructions::create_ticket_nft::create_ticket_nft(ctx, nft_name, nft_symbol, nft_uri)
    }
    
    pub fn create_receipt(ctx: Context<CreateReceipt>, receipt_name: String, receipt_symbol: String, receipt_uri: String) -> Result<()> {
        instructions::create_receipt(ctx, receipt_name, receipt_symbol, receipt_uri)
    }

    pub fn approve_token(ctx: Context<ApproveToken>, amount: u64) -> Result<()> {
        instructions::approve_token::approve_token(ctx, amount)
    }

    pub fn initialize_burn_tracker(ctx: Context<InitializeBurnTracker>) -> Result<()> {
        instructions::burn_token_transfer_nft::initialize_burn_tracker(ctx)
    }

    pub fn burn_token_transfer_nft(ctx: Context<TransferToken>, amount: u64, value: u64) -> Result<()> {
        instructions::burn_token_transfer_nft::burn_token_transfer_nft(ctx, amount, value )
    }

    pub fn burn_token_only(ctx: Context<BurnTokenOnly>) -> Result<()> {
        instructions::burn_token_only::burn_token_only(ctx)
    }

    // New function added for activating the ticket
    pub fn activate_ticket(ctx: Context<ActivateTicket>) -> Result<()> {
        instructions::create_ticket_nft::activate_ticket(ctx)
    }

    // New function added for getting the ticket status
    pub fn get_ticket_status(ctx: Context<GetTicketStatus>) -> Result<(TicketStatus, i64)> {
        instructions::create_ticket_nft::get_ticket_status(ctx)
    }
}