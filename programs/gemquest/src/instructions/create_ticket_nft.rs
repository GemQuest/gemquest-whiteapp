use {
    anchor_lang::prelude::*,
    anchor_spl::{
        associated_token::AssociatedToken,
        metadata::{
            create_metadata_accounts_v3,
            create_master_edition_v3,
            set_and_verify_collection,
            mpl_token_metadata::types::{DataV2, Collection, CollectionDetails},
            CreateMetadataAccountsV3,
            CreateMasterEditionV3,
            SetAndVerifyCollection,
            Metadata,
        },
        token::{mint_to, Mint, MintTo, Token, TokenAccount},
    },
};
use std::boxed::Box;

pub const INITIAL_PRICE: u64 = 200_000_000; 
pub const INITIAL_PRICE_SEED: &[u8] = b"initial_price";
pub const TICKET_STATUS_SEED: &[u8] = b"ticket_status";

#[derive(AnchorSerialize, AnchorDeserialize, Clone, PartialEq, Eq)]
pub enum TicketStatus {
    Inactive = 0,
    Active = 1,
}

impl Default for TicketStatus {
    fn default() -> Self {
        TicketStatus::Inactive
    }
}

#[account]
pub struct InitialPriceAccount {
    pub price: u64,
}

#[account]
pub struct TicketStatusAccount {
    pub status: TicketStatus,
    pub expiration: i64, 
}

#[derive(Accounts)]
pub struct InitializeInitialPrice<'info> {
    #[account(
        init,
        payer = admin,
        space = 8 + 8,
        seeds = [INITIAL_PRICE_SEED],
        bump
    )]
    pub initial_price_account: Box<Account<'info, InitialPriceAccount>>,
    #[account(mut)]
    pub admin: Signer<'info>,
    pub system_program: Program<'info, System>,
}

#[derive(Accounts)]
pub struct UpdateInitialPrice<'info> {
    #[account(mut, seeds = [INITIAL_PRICE_SEED], bump)]
    pub initial_price_account: Box<Account<'info, InitialPriceAccount>>,
    #[account(mut)]
    pub admin: Signer<'info>,
}

#[derive(Accounts)]
pub struct GetInitialPrice<'info> {
    #[account(seeds = [INITIAL_PRICE_SEED], bump)]
    pub initial_price_account: Box<Account<'info, InitialPriceAccount>>,
}

#[derive(Accounts)]
pub struct InitializeCollection<'info> {
    #[account(mut)]
    pub admin: Signer<'info>,
    #[account(
        init,
        payer = admin,
        mint::decimals = 0,
        mint::authority = admin.key(),
        mint::freeze_authority = admin.key(),
    )]
    pub collection_mint: Box<Account<'info, Mint>>,
    #[account(
        init,
        payer = admin,
        associated_token::mint = collection_mint,
        associated_token::authority = admin,
    )]
    pub collection_token_account: Box<Account<'info, TokenAccount>>,
    /// CHECK: We're about to create this with Metaplex
    #[account(
        mut,
        seeds = [b"metadata", token_metadata_program.key().as_ref(), collection_mint.key().as_ref()],
        bump,
        seeds::program = token_metadata_program.key(),
    )]
    pub collection_metadata: UncheckedAccount<'info>,
    /// CHECK: We're about to create this with Metaplex
    #[account(
        mut,
        seeds = [b"metadata", token_metadata_program.key().as_ref(), collection_mint.key().as_ref(), b"edition"],
        bump,
        seeds::program = token_metadata_program.key(),
    )]
    pub collection_master_edition: UncheckedAccount<'info>,
    pub token_metadata_program: Program<'info, Metadata>,
    pub token_program: Program<'info, Token>,
    pub associated_token_program: Program<'info, AssociatedToken>,
    pub system_program: Program<'info, System>,
    pub rent: Sysvar<'info, Rent>,
}

#[derive(Accounts)]
pub struct CreateTicketNFT<'info> {
    #[account(mut)]
    pub payer: Signer<'info>,
    #[account(mut)]
    /// CHECK: This is the admin account that receives the payment
    pub admin: Signer<'info>,
    #[account(seeds = [INITIAL_PRICE_SEED], bump)]
    /// CHECK: This is the update authority for the NFT
   

    pub initial_price_account: Box<Account<'info, InitialPriceAccount>>,
    /// CHECK: Validate address by deriving pda
    #[account(
        mut,
        seeds = [b"metadata", token_metadata_program.key().as_ref(), mint_nft_account.key().as_ref()],
        bump,
        seeds::program = token_metadata_program.key(),
    )]
    pub metadata_account: UncheckedAccount<'info>,
    #[account(
        init,
        payer = payer,
        mint::decimals = 0,
        mint::authority = admin.key(),
        mint::freeze_authority = admin.key(),
    )]
    pub mint_nft_account: Box<Account<'info, Mint>>,
    #[account(
        init,
        payer = payer,
        associated_token::mint = mint_nft_account,
        associated_token::authority = payer,
    )]
    pub associated_nft_token_account: Box<Account<'info, TokenAccount>>,
    #[account(
        init,
        payer = payer,
        space = 8 + 4 + 8,
        seeds = [TICKET_STATUS_SEED, mint_nft_account.key().as_ref()],
        bump
    )]
    pub ticket_status_account: Box<Account<'info, TicketStatusAccount>>,
    /// CHECK: We're using this as a signing PDA
    // #[account(seeds = [b"collection"], bump)]
    // pub collection_authority: UncheckedAccount<'info>,
    pub collection_mint: Box<Account<'info, Mint>>,
    /// CHECK: We're going to use this with Metaplex
    #[account(
        seeds = [b"metadata", token_metadata_program.key().as_ref(), collection_mint.key().as_ref()],
        bump,
        seeds::program = token_metadata_program.key(),
    )]
    pub collection_metadata: UncheckedAccount<'info>,
    /// CHECK: We're going to use this with Metaplex
    #[account(
        seeds = [b"metadata", token_metadata_program.key().as_ref(), collection_mint.key().as_ref(), b"edition"],
        bump,
        seeds::program = token_metadata_program.key(),
    )]
    pub collection_master_edition: UncheckedAccount<'info>,
    pub token_program: Program<'info, Token>,
    pub token_metadata_program: Program<'info, Metadata>,
    pub associated_token_program: Program<'info, AssociatedToken>,
    pub system_program: Program<'info, System>,
    pub rent: Sysvar<'info, Rent>,
}

#[derive(Accounts)]
pub struct ActivateTicket<'info> {
    #[account(mut, seeds = [TICKET_STATUS_SEED, mint.key().as_ref()], bump)]
    pub ticket_status_account: Box<Account<'info, TicketStatusAccount>>,
    pub mint: Account<'info, Mint>,
    #[account(mut)]
    pub admin: Signer<'info>,
}

#[derive(Accounts)]
pub struct GetTicketStatus<'info> {
    #[account(seeds = [TICKET_STATUS_SEED, ticket_status_account.key().as_ref()], bump)]
    pub ticket_status_account: Box<Account<'info, TicketStatusAccount>>,
}

pub fn initialize_initial_price(ctx: Context<InitializeInitialPrice>) -> Result<()> {
    ctx.accounts.initial_price_account.price = INITIAL_PRICE;
    Ok(())
}

pub fn update_initial_price(ctx: Context<UpdateInitialPrice>, new_price: u64) -> Result<()> {
    ctx.accounts.initial_price_account.price = new_price;
    Ok(())
}

pub fn get_initial_price(ctx: Context<GetInitialPrice>) -> Result<u64> {
    Ok(ctx.accounts.initial_price_account.price)
}

pub fn initialize_collection(
    ctx: Context<InitializeCollection>,
    name: String,
    symbol: String,
    uri: String,
) -> Result<()> {
    // Mint one token
    mint_to(
        CpiContext::new(
            ctx.accounts.token_program.to_account_info(),
            MintTo {
                mint: ctx.accounts.collection_mint.to_account_info(),
                to: ctx.accounts.collection_token_account.to_account_info(),
                authority: ctx.accounts.admin.to_account_info(),
            },
        ),
        1,
    )?;

    create_metadata_accounts_v3(
        CpiContext::new(
            ctx.accounts.token_metadata_program.to_account_info(),
            CreateMetadataAccountsV3 {
                metadata: ctx.accounts.collection_metadata.to_account_info(),
                mint: ctx.accounts.collection_mint.to_account_info(),
                mint_authority: ctx.accounts.admin.to_account_info(),
                update_authority: ctx.accounts.admin.to_account_info(),
                payer: ctx.accounts.admin.to_account_info(),
                system_program: ctx.accounts.system_program.to_account_info(),
                rent: ctx.accounts.rent.to_account_info(),
            },
        ),
        DataV2 {
            name,
            symbol,
            uri,
            seller_fee_basis_points: 0,
            creators: None,
            collection: None,
            uses: None,
        },
        true,
        true,
        None,
    )?;
    
    create_master_edition_v3(
        CpiContext::new(
            ctx.accounts.token_metadata_program.to_account_info(),
            CreateMasterEditionV3 {
                edition: ctx.accounts.collection_master_edition.to_account_info(),
                mint: ctx.accounts.collection_mint.to_account_info(),
                update_authority: ctx.accounts.admin.to_account_info(),
                mint_authority: ctx.accounts.admin.to_account_info(),
                metadata: ctx.accounts.collection_metadata.to_account_info(),
                payer: ctx.accounts.admin.to_account_info(),
                token_program: ctx.accounts.token_program.to_account_info(),
                system_program: ctx.accounts.system_program.to_account_info(),
                rent: ctx.accounts.rent.to_account_info(),
            },
        ),
        Some(0),
    )?;

    Ok(())
}

pub fn create_ticket_nft(
    ctx: Context<CreateTicketNFT>,
    nft_name: String,
    nft_symbol: String,
    nft_uri: String,
) -> Result<()> {
    let price = ctx.accounts.initial_price_account.price;

    if nft_name.is_empty() || nft_symbol.is_empty() || nft_uri.is_empty() {
        return Err(ErrorCode::InvalidInput.into());
    }

    anchor_lang::system_program::transfer(
        CpiContext::new(
            ctx.accounts.system_program.to_account_info(),
            anchor_lang::system_program::Transfer {
                from: ctx.accounts.payer.to_account_info(),
                to: ctx.accounts.admin.to_account_info(),
            },
        ),
        price,
    )?;

    mint_to(
        CpiContext::new(
            ctx.accounts.token_program.to_account_info(),
            MintTo {
                mint: ctx.accounts.mint_nft_account.to_account_info(),
                to: ctx.accounts.associated_nft_token_account.to_account_info(),
                authority: ctx.accounts.admin.to_account_info(),
            },
        ),
        1,
    )?;

    create_metadata_accounts_v3(
        CpiContext::new(
            ctx.accounts.token_metadata_program.to_account_info(),
            CreateMetadataAccountsV3 {
                metadata: ctx.accounts.metadata_account.to_account_info(),
                mint: ctx.accounts.mint_nft_account.to_account_info(),
                mint_authority: ctx.accounts.admin.to_account_info(),
                update_authority: ctx.accounts.admin.to_account_info(),
                payer: ctx.accounts.payer.to_account_info(),
                system_program: ctx.accounts.system_program.to_account_info(),
                rent: ctx.accounts.rent.to_account_info(),
            },
        ),
        DataV2 {
            name: nft_name,
            symbol: nft_symbol,
            uri: nft_uri,
            seller_fee_basis_points: 0,
            creators: None,
            collection: Some(Collection {
                verified: false,
                key: ctx.accounts.collection_mint.key(),
            }),
            uses: None,
        },
        true,
        false,
        None,
    )?;

    set_and_verify_collection(
        CpiContext::new(
            ctx.accounts.token_metadata_program.to_account_info(),
            anchor_spl::metadata::SetAndVerifyCollection {
                metadata: ctx.accounts.metadata_account.to_account_info(),
                collection_authority: ctx.accounts.admin.to_account_info(),
                payer: ctx.accounts.payer.to_account_info(),
                update_authority: ctx.accounts.admin.to_account_info(),
                collection_mint: ctx.accounts.collection_mint.to_account_info(),
                collection_metadata: ctx.accounts.collection_metadata.to_account_info(),
                collection_master_edition: ctx.accounts.collection_master_edition.to_account_info(),
            },
        ),
        None,
    )?;

    ctx.accounts.ticket_status_account.status = TicketStatus::Inactive;
    ctx.accounts.ticket_status_account.expiration = 0;

    Ok(())
}

pub fn activate_ticket(ctx: Context<ActivateTicket>) -> Result<()> {
    let clock = Clock::get()?;
    let current_time = clock.unix_timestamp;
    let expiration_time = current_time + 24 * 60 * 60; 
    ctx.accounts.ticket_status_account.status = TicketStatus::Active;
    ctx.accounts.ticket_status_account.expiration = expiration_time;
    Ok(())
}

pub fn get_ticket_status(ctx: Context<GetTicketStatus>) -> Result<(TicketStatus, i64)> {
    Ok((
        ctx.accounts.ticket_status_account.status.clone(),
        ctx.accounts.ticket_status_account.expiration
    ))
}

#[error_code]
pub enum ErrorCode {
    #[msg("Invalid input provided.")]
    InvalidInput,
    #[msg("Invalid price provided.")]
    InvalidPrice,
    #[msg("Unauthorized access.")]
    Unauthorized,
}